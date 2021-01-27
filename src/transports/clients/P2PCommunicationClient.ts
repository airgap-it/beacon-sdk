import * as sodium from 'libsodium-wrappers'
import BigNumber from 'bignumber.js'

import {
  getHexHash,
  toHex,
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
import { P2PPairingRequest, StorageKey } from '../..'
import { BEACON_VERSION } from '../../constants'
import { generateGUID } from '../../utils/generate-uuid'
import { ExtendedP2PPairingResponse, P2PPairingResponse } from '../../types/P2PPairingResponse'
import { getSenderId } from '../../utils/get-sender-id'
import { Logger } from '../../utils/Logger'
import { CommunicationClient } from './CommunicationClient'

const logger = new Logger('P2PCommunicationClient')

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
    matrixNodes: string[]
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
    logger.log('starting client')
    await sodium.ready

    const loginRawDigest = sodium.crypto_generichash(
      32,
      sodium.from_string(`login:${Math.floor(Date.now() / 1000 / (5 * 60))}`)
    )
    const rawSignature = sodium.crypto_sign_detached(loginRawDigest, this.keyPair.privateKey)

    logger.log(`connecting to ${this.replicationCount} servers`)

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

      logger.log(
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
        .catch((error) => logger.log(error))

      await client.joinRooms(...client.invitedRooms).catch((error) => logger.log(error))

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
            const decryptedMessage = await decryptCryptoboxPayload(payload, sharedRx)

            // console.log('calculated sender ID', await getSenderId(senderPublicKey))
            // TODO: Add check for correct decryption key / sender ID

            messageCallback(decryptedMessage)
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

  public async sendMessage(
    message: string,
    peer: P2PPairingRequest | ExtendedP2PPairingResponse
  ): Promise<void> {
    const { sharedTx } = await this.createCryptoBoxClient(peer.publicKey, this.keyPair.privateKey)

    for (let i = 0; i < this.replicationCount; i++) {
      const recipientHash: string = await getHexHash(Buffer.from(peer.publicKey, 'hex'))
      const recipient = recipientString(
        recipientHash,
        await this.getRelayServer(recipientHash, i.toString())
      )

      for (const client of this.clients) {
        const roomId = await this.getRelevantRoom(client, recipient)

        const encryptedMessage = await encryptCryptoboxPayload(message, sharedTx)
        client.sendTextMessage(roomId, encryptedMessage).catch(async (error) => {
          if (error.errcode === 'M_FORBIDDEN') {
            // Room doesn't exist
            logger.log('sendMessage', 'M_FORBIDDEN', error)
            await this.deleteRoomIdFromRooms(roomId)
            const newRoomId = await this.getRelevantRoom(client, recipient)
            client.sendTextMessage(newRoomId, encryptedMessage).catch(async (error2) => {
              logger.log('sendMessage', 'inner error', error2)
            })
          } else {
            logger.log('sendMessage', 'not forbidden', error)
          }
        })
      }
    }
  }

  public async deleteRoomIdFromRooms(roomId: string): Promise<void> {
    const roomIds = await this.storage.get(StorageKey.MATRIX_PEER_ROOM_IDS)
    const newRoomIds = Object.entries(roomIds)
      .filter((entry) => entry[1] !== roomId)
      .reduce(
        (pv, cv) => ({ ...pv, [cv[0]]: cv[1] }),
        {} as {
          [key: string]: string | undefined
        }
      )
    await this.storage.set(StorageKey.MATRIX_PEER_ROOM_IDS, newRoomIds)
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: ExtendedP2PPairingResponse) => void
  ): Promise<void> {
    for (const client of this.clients) {
      client.subscribe(MatrixClientEventType.MESSAGE, async (event) => {
        logger.log('channel opening', JSON.stringify(event))
        if (this.isTextMessage(event.content) && (await this.isChannelOpenMessage(event.content))) {
          logger.log('new channel open event!')

          const splits = event.content.message.content.split(':')
          const payload = Buffer.from(splits[splits.length - 1], 'hex')

          if (
            payload.length >=
            sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES
          ) {
            try {
              const pairingResponse: P2PPairingResponse = JSON.parse(
                await openCryptobox(payload, this.keyPair.publicKey, this.keyPair.privateKey)
              )

              messageCallback({
                ...pairingResponse,
                senderId: await getSenderId(pairingResponse.publicKey)
              })
            } catch (decryptionError) {
              /* NO-OP. We try to decode every message, but some might not be addressed to us. */
            }
          }
        }
      })
    }
  }

  public async sendPairingResponse(pairingRequest: P2PPairingRequest): Promise<void> {
    logger.log('open channel')
    const recipientHash = await getHexHash(Buffer.from(pairingRequest.publicKey, 'hex'))
    const recipient = recipientString(recipientHash, pairingRequest.relayServer)

    logger.log(`currently there are ${this.clients.length} clients open`)
    for (const client of this.clients) {
      const roomId = await this.getRelevantRoom(client, recipient)

      // TODO: remove v1 backwards-compatibility
      const message: string =
        typeof pairingRequest.version === 'undefined'
          ? await this.getPublicKey() // v1
          : JSON.stringify(await this.getPairingResponseInfo(pairingRequest)) // v2

      const encryptedMessage: string = await this.encryptMessageAsymmetric(
        pairingRequest.publicKey,
        message
      )

      client
        .sendTextMessage(roomId, ['@channel-open', recipient, encryptedMessage].join(':'))
        .catch((error) => logger.log(error))
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

  private async getRelevantRoom(client: MatrixClient, recipient: string): Promise<string> {
    const roomIds = await this.storage.get(StorageKey.MATRIX_PEER_ROOM_IDS)
    let roomId = roomIds[recipient]

    if (!roomId) {
      logger.log(`No room found for peer ${recipient}, checking joined ones.`)
      const room = await this.getRelevantJoinedRoom(client, recipient)
      roomId = room.id
      roomIds[recipient] = room.id
      await this.storage.set(StorageKey.MATRIX_PEER_ROOM_IDS, roomIds)
    }

    logger.log(`Using room ${roomId}`)

    return roomId
  }

  private async getRelevantJoinedRoom(
    client: MatrixClient,
    recipient: string
  ): Promise<MatrixRoom> {
    const joinedRooms = client.joinedRooms
    const relevantRooms = joinedRooms.filter((roomElement: MatrixRoom) =>
      roomElement.members.some((member: string) => member === recipient)
    )

    let room: MatrixRoom
    if (relevantRooms.length === 0) {
      logger.log(`no relevant rooms found`)

      const roomId = await client.createTrustedPrivateRoom(recipient)
      room = client.getRoomById(roomId)
    } else {
      room = relevantRooms[0]
      logger.log(`channel already open, reusing room ${room.id}`)
    }

    return room
  }
}
