import * as sodium from 'libsodium-wrappers'
import BigNumber from 'bignumber.js'

import {
  getHexHash,
  toHex,
  sealCryptobox,
  recipientString,
  openCryptobox,
  encryptCryptoboxPayload,
  decryptCryptoboxPayload
} from '../../utils/crypto'
import { MatrixClient } from '../../matrix-client/MatrixClient'
import {
  MatrixClientEvent,
  MatrixClientEventType,
  MatrixClientEventMessageContent
} from '../../matrix-client/models/MatrixClientEvent'
import { MatrixMessageType } from '../../matrix-client/models/MatrixMessage'
import { MatrixRoom } from '../../matrix-client/models/MatrixRoom'
import { Storage } from '../../storage/Storage'
import { P2PPairingRequest } from '../..'
import { BEACON_VERSION } from '../../constants'
import { generateGUID } from '../../utils/generate-uuid'
import { P2PPairingResponse } from '../../types/P2PPairingResponse'
import { CommunicationClient } from './CommunicationClient'

const KNOWN_RELAY_SERVERS = [
  'matrix.papers.tech'
  // 'matrix.tez.ie',
  // 'matrix-dev.papers.tech',
  // "matrix.stove-labs.com",
  // "yadayada.cryptonomic-infra.tech"
]

export class P2PCommunicationClient extends CommunicationClient {
  private readonly clients: MatrixClient[] = []

  private readonly KNOWN_RELAY_SERVERS: string[]

  private readonly activeListeners: Map<string, (event: MatrixClientEvent<any>) => void> = new Map()

  constructor(
    private readonly name: string,
    keyPair: sodium.KeyPair,
    public readonly replicationCount: number,
    private readonly storage: Storage,
    matrixNodes: string[],
    private readonly debug: boolean = false
  ) {
    super(keyPair)

    this.KNOWN_RELAY_SERVERS = matrixNodes.length > 0 ? matrixNodes : KNOWN_RELAY_SERVERS
  }

  public async getPairingRequestInfo(): Promise<P2PPairingRequest> {
    return {
      id: await generateGUID(),
      type: 'p2p-pairing-request',
      name: this.name,
      version: BEACON_VERSION,
      publicKey: await this.getPublicKey(),
      relayServer: await this.getRelayServer()
    }
  }

  public async getPairingResponseInfo(request: P2PPairingRequest): Promise<P2PPairingResponse> {
    return {
      id: request.id,
      type: 'p2p-pairing-response',
      name: this.name,
      version: BEACON_VERSION,
      publicKey: await this.getPublicKey(),
      relayServer: await this.getRelayServer()
    }
  }

  public async getRelayServer(publicKeyHash?: string, nonce: string = ''): Promise<string> {
    const hash: string = publicKeyHash || (await getHexHash(this.keyPair.publicKey))

    return this.KNOWN_RELAY_SERVERS.reduce(async (prevPromise: Promise<string>, curr: string) => {
      const prev = await prevPromise
      const prevRelayServerHash: string = await getHexHash(prev + nonce)
      const currRelayServerHash: string = await getHexHash(curr + nonce)

      const prevBigInt = await this.getAbsoluteBigIntDifference(hash, prevRelayServerHash)
      const currBigInt = await this.getAbsoluteBigIntDifference(hash, currRelayServerHash)

      return prevBigInt.isLessThan(currBigInt) ? prev : curr
    }, Promise.resolve(this.KNOWN_RELAY_SERVERS[0]))
  }

  public async start(): Promise<void> {
    await this.log('starting client')
    await sodium.ready

    const loginRawDigest = sodium.crypto_generichash(
      32,
      sodium.from_string(`login:${Math.floor(Date.now() / 1000 / (5 * 60))}`)
    )
    const rawSignature = sodium.crypto_sign_detached(loginRawDigest, this.keyPair.privateKey)

    await this.log(`connecting to ${this.replicationCount} servers`)

    for (let i = 0; i < this.replicationCount; i++) {
      // TODO: Parallel
      const client = MatrixClient.create({
        baseUrl: `https://${await this.getRelayServer(
          await this.getPublicKeyHash(),
          i.toString()
        )}`,
        storage: this.storage
      })

      client.subscribe(MatrixClientEventType.INVITE, async (event) => {
        await client.joinRooms(event.content.roomId)
      })

      await this.log(
        'login',
        await this.getPublicKeyHash(),
        'on',
        await this.getRelayServer(await this.getPublicKeyHash(), i.toString())
      )

      await client
        .start({
          id: await this.getPublicKeyHash(),
          password: `ed:${toHex(rawSignature)}:${await this.getPublicKey()}`,
          deviceId: toHex(this.keyPair.publicKey)
        })
        .catch((error) => this.log(error))

      await client.joinRooms(...client.invitedRooms).catch((error) => this.log(error))

      this.clients.push(client)
    }
  }

  public async listenForEncryptedMessage(
    senderPublicKey: string,
    messageCallback: (message: string) => void
  ): Promise<void> {
    if (this.activeListeners.has(senderPublicKey)) {
      return
    }

    const { sharedRx } = await this.createCryptoBoxServer(senderPublicKey, this.keyPair.privateKey)

    const callbackFunction = async (
      event: MatrixClientEvent<MatrixClientEventType.MESSAGE>
    ): Promise<void> => {
      if (this.isTextMessage(event.content) && (await this.isSender(event, senderPublicKey))) {
        let payload

        try {
          payload = Buffer.from(event.content.message.content, 'hex')
          // content can be non-hex if it's a connection open request
        } catch {
          /* */
        }
        if (
          payload &&
          payload.length >= sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES
        ) {
          try {
            messageCallback(await decryptCryptoboxPayload(payload, sharedRx))
          } catch (decryptionError) {
            /* NO-OP. We try to decode every message, but some might not be addressed to us. */
          }
        }
      }
    }

    this.activeListeners.set(senderPublicKey, callbackFunction)

    for (const client of this.clients) {
      client.subscribe(MatrixClientEventType.MESSAGE, callbackFunction)
    }
  }

  public async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    const listener = this.activeListeners.get(senderPublicKey)
    if (!listener) {
      return
    }

    for (const client of this.clients) {
      client.unsubscribe(MatrixClientEventType.MESSAGE, listener)
    }

    this.activeListeners.delete(senderPublicKey)
  }

  public async unsubscribeFromEncryptedMessages(): Promise<void> {
    for (const client of this.clients) {
      client.unsubscribe(MatrixClientEventType.MESSAGE)
    }

    this.activeListeners.clear()
  }

  public async sendMessage(recipientPublicKey: string, message: string): Promise<void> {
    const { sharedTx } = await this.createCryptoBoxClient(
      recipientPublicKey,
      this.keyPair.privateKey
    )

    for (let i = 0; i < this.replicationCount; i++) {
      const recipientHash: string = await getHexHash(Buffer.from(recipientPublicKey, 'hex'))
      const recipient = recipientString(
        recipientHash,
        await this.getRelayServer(recipientHash, i.toString())
      )

      for (const client of this.clients) {
        const room = await this.getRelevantRoom(client, recipient)

        client
          .sendTextMessage(room.id, await encryptCryptoboxPayload(message, sharedTx))
          .catch((error) => this.log(error))
      }
    }
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: P2PPairingResponse) => void
  ): Promise<void> {
    for (const client of this.clients) {
      client.subscribe(MatrixClientEventType.MESSAGE, async (event) => {
        await this.log('channel opening', event)
        if (this.isTextMessage(event.content) && (await this.isChannelOpenMessage(event.content))) {
          await this.log('new channel open event!')

          const splits = event.content.message.content.split(':')
          const payload = Buffer.from(splits[splits.length - 1], 'hex')

          if (
            payload.length >=
            sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES
          ) {
            try {
              messageCallback(
                JSON.parse(
                  await openCryptobox(payload, this.keyPair.publicKey, this.keyPair.privateKey)
                )
              )
            } catch (decryptionError) {
              /* NO-OP. We try to decode every message, but some might not be addressed to us. */
            }
          }
        }
      })
    }
  }

  public async sendPairingResponse(pairingRequest: P2PPairingRequest): Promise<void> {
    await this.log('open channel')
    const recipientHash = await getHexHash(Buffer.from(pairingRequest.publicKey, 'hex'))
    const recipient = recipientString(recipientHash, pairingRequest.relayServer)

    await this.log(`currently there are ${this.clients.length} clients open`)
    for (const client of this.clients) {
      const room = await this.getRelevantRoom(client, recipient)

      // TODO: remove v1 backwards-compatibility
      const message: string =
        typeof pairingRequest.version === 'undefined'
          ? await this.getPublicKey() // v1
          : JSON.stringify(await this.getPairingResponseInfo(pairingRequest)) // v2

      const encryptedMessage: string = await sealCryptobox(
        message,
        Buffer.from(pairingRequest.publicKey, 'hex')
      )
      client
        .sendTextMessage(room.id, ['@channel-open', recipient, encryptedMessage].join(':'))
        .catch((error) => this.log(error))
    }
  }

  public isTextMessage(
    content: MatrixClientEventMessageContent<any>
  ): content is MatrixClientEventMessageContent<string> {
    return content.message.type === MatrixMessageType.TEXT
  }

  public async isChannelOpenMessage(
    content: MatrixClientEventMessageContent<string>
  ): Promise<boolean> {
    return content.message.content.startsWith(
      `@channel-open:@${await getHexHash(Buffer.from(await this.getPublicKey(), 'hex'))}`
    )
  }

  public async isSender(
    event: MatrixClientEvent<MatrixClientEventType.MESSAGE>,
    senderPublicKey: string
  ): Promise<boolean> {
    return event.content.message.sender.startsWith(
      `@${await getHexHash(Buffer.from(senderPublicKey, 'hex'))}`
    )
  }

  private async getAbsoluteBigIntDifference(
    firstHash: string,
    secondHash: string
  ): Promise<BigNumber> {
    const difference: BigNumber = new BigNumber(`0x${firstHash}`).minus(`0x${secondHash}`)

    return difference.absoluteValue()
  }

  private async getRelevantRoom(client: MatrixClient, recipient: string): Promise<MatrixRoom> {
    const joinedRooms = client.joinedRooms
    const relevantRooms = joinedRooms.filter((roomElement: MatrixRoom) =>
      roomElement.members.some((member: string) => member === recipient)
    )

    let room: MatrixRoom
    if (relevantRooms.length === 0) {
      await this.log(`no relevant rooms found`)

      const roomId = await client.createTrustedPrivateRoom(recipient)
      room = client.getRoomById(roomId)
    } else {
      room = relevantRooms[0]
      await this.log(`channel already open, reusing room ${room.id}`)
    }

    return room
  }

  private async log(...args: unknown[]): Promise<void> {
    if (this.debug) {
      console.log(`--- [P2PCommunicationClient]:${this.name}: `, ...args)
    }
  }
}
