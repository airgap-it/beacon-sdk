import * as sodium from 'libsodium-wrappers'

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
import { P2PPairingRequest, StorageKey } from '../..'
import { BEACON_VERSION } from '../../constants'
import { PeerManager } from '../../managers/PeerManager'
import { CommunicationClient } from './CommunicationClient'

const KNOWN_RELAY_SERVERS = [
  'matrix.papers.tech',
  'matrix-dev.papers.tech'
  // 'matrix.tez.ie',
  // "matrix.stove-labs.com",
  // "yadayada.cryptonomic-infra.tech"
]

export class P2PCommunicationClient extends CommunicationClient {
  private client: MatrixClient | undefined

  private relayServerIndex: number = 0

  private readonly KNOWN_RELAY_SERVERS: string[]

  private readonly activeListeners: Map<string, (event: MatrixClientEvent<any>) => void> = new Map()

  constructor(
    private readonly name: string,
    keyPair: sodium.KeyPair,
    private readonly storage: Storage,
    matrixNodes: string[],
    private readonly debug: boolean = false
  ) {
    super(keyPair)

    this.KNOWN_RELAY_SERVERS = matrixNodes.length > 0 ? matrixNodes : KNOWN_RELAY_SERVERS
  }

  public async getHandshakeInfo(): Promise<P2PPairingRequest> {
    return {
      name: this.name,
      version: BEACON_VERSION,
      publicKey: await this.getPublicKey(),
      relayServer: await this.getRelayServer()
    }
  }

  public async getRelayServer(_publicKeyHash?: string, _nonce: string = ''): Promise<string> {
    return this.KNOWN_RELAY_SERVERS[this.relayServerIndex]
  }

  public async start(): Promise<void> {
    await this.log('starting client')
    await sodium.ready

    await this.connectClient()
  }

  // TODO: Make private
  public async connectClient(): Promise<void> {
    this.relayServerIndex = this.relayServerIndex % this.KNOWN_RELAY_SERVERS.length
    const loginRawDigest = sodium.crypto_generichash(
      32,
      sodium.from_string(`login:${Math.floor(Date.now() / 1000 / (5 * 60))}`)
    )
    const rawSignature = sodium.crypto_sign_detached(loginRawDigest, this.keyPair.privateKey)

    await this.log(`connecting to server. Relay server index ${this.relayServerIndex}`)

    const relayServer = await this.getRelayServer(
      await this.getPublicKeyHash(),
      this.relayServerIndex.toString()
    )

    const client = MatrixClient.create({
      baseUrl: `https://${relayServer}`,
      storage: this.storage
    })

    this.client = client

    client.subscribe(MatrixClientEventType.INVITE, async (event) => {
      await this.log('received an invite to room', event.content.roomId)
      await client.joinRooms(event.content.roomId)
    })

    await this.log('login', await this.getPublicKeyHash(), 'on', relayServer)

    await this.log('pubkey', await this.getPublicKey())
    await this.log('pubkeyHash', await this.getPublicKeyHash())

    await client
      .start({
        id: await this.getPublicKeyHash(),
        password: `ed:${toHex(rawSignature)}:${await this.getPublicKey()}`,
        deviceId: toHex(this.keyPair.publicKey)
      })
      .catch(async (error) => {
        await this.log(error.message)

        this.relayServerIndex++

        // return new Promise((resolve) =>
        //   setTimeout(async () => {
        //     await this.connectClient()
        //     resolve()
        //   }, 2000)
        // )
      })

    await this.log(`Invited to ${client.invitedRooms.length} rooms. Attempting to join`)
    await client.joinRooms(...client.invitedRooms).catch((error) => this.log(error))

    // Make sure we are part of all rooms that we know of
    await this.joinRoomsIfNotJoined(client, ['test'])
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
      await this.log('got encrypted message', event.content.message.content)
      if (this.isTextMessage(event.content) && (await this.isSender(event, senderPublicKey))) {
        await this.log('matching')
        const payload = Buffer.from(event.content.message.content, 'hex')
        if (
          payload.length >=
          sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES
        ) {
          try {
            messageCallback(await decryptCryptoboxPayload(payload, sharedRx))
          } catch (decryptionError) {
            /* NO-OP. We try to decode every message, but some might not be addressed to us. */
          }
        }
      } else {
        await this.log('NOT matching')
      }
    }

    this.activeListeners.set(senderPublicKey, callbackFunction)

    if (!this.client) {
      throw new Error('Client not defined')
    }
    this.client.subscribe(MatrixClientEventType.MESSAGE, callbackFunction)
  }

  public async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    const listener = this.activeListeners.get(senderPublicKey)
    if (!listener) {
      return
    }

    if (!this.client) {
      throw new Error('Client not defined')
    }

    this.client.unsubscribe(MatrixClientEventType.MESSAGE, listener)

    this.activeListeners.delete(senderPublicKey)
  }

  public async unsubscribeFromEncryptedMessages(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not defined')
    }

    this.client.unsubscribe(MatrixClientEventType.MESSAGE)

    this.activeListeners.clear()
  }

  public async sendMessage(recipientPublicKey: string, message: string): Promise<void> {
    const { sharedTx } = await this.createCryptoBoxClient(
      recipientPublicKey,
      this.keyPair.privateKey
    )

    const recipientHash: string = await getHexHash(Buffer.from(recipientPublicKey, 'hex'))
    const recipient = recipientString(recipientHash, await this.getRelayServer())

    await this.log(`sending from ${this.name} to:`, recipient)

    if (!this.client) {
      throw new Error('Client not defined')
    }

    const room = await this.getRelevantRoom(this.client, recipient)
    // await this.log(`found relevant room for ${this.name} to:`, room)

    const encryptedMessage = await encryptCryptoboxPayload(message, sharedTx)
    await this.log('sending', encryptedMessage)
    this.client.sendTextMessage(room.id, encryptedMessage).catch((error) => this.log(error))
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: P2PPairingRequest) => void
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Client not defined')
    }

    this.client.subscribe(MatrixClientEventType.MESSAGE, async (event) => {
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

  public async sendPairingResponse(recipientPublicKey: string, relayServer: string): Promise<void> {
    await this.log('open channel')
    const recipientHash = await getHexHash(Buffer.from(recipientPublicKey, 'hex'))
    const recipient = recipientString(recipientHash, relayServer)

    if (!this.client) {
      throw new Error('Client not defined')
    }

    const roomId = await this.client.createTrustedPrivateRoom(recipient)
    const peerManager = new PeerManager(this.storage, StorageKey.TRANSPORT_P2P_PEERS)
    const peer = await peerManager.getPeer(recipientPublicKey)
    if (peer) {
      ;(peer as any).roomId = roomId
      await peerManager.addPeer(peer)
    }
    const room = this.client.getRoomById(roomId)

    const encryptedMessage: string = await sealCryptobox(
      JSON.stringify(await this.getHandshakeInfo()),
      Buffer.from(recipientPublicKey, 'hex')
    )
    this.client
      .sendTextMessage(room.id, ['@channel-open', recipient, encryptedMessage].join(':'))
      .catch((error) => this.log(error))
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

  private async joinRoomsIfNotJoined(client: MatrixClient, roomIds: string[]): Promise<void> {
    await this.log(`checking ${roomIds.length} rooms if we need to join`)

    const joinedRooms = client.joinedRooms
    const roomsToJoin: string[] = []
    roomIds.forEach((roomId) => {
      if (joinedRooms.some((room) => room.id === roomId)) {
        roomsToJoin.push(roomId)
      }
    })

    await this.log(`need to join ${roomsToJoin.length} rooms`)

    if (roomsToJoin.length > 0) {
      await client.joinRooms(...roomsToJoin)
    }
  }

  private async getRelevantRoom(client: MatrixClient, recipient: string): Promise<MatrixRoom> {
    const joinedRooms = client.joinedRooms
    // await this.log('joined rooms', joinedRooms)
    const relevantRooms = joinedRooms.filter((roomElement: MatrixRoom) =>
      roomElement.members.some((member: string) => member === recipient)
    )

    let room: MatrixRoom
    if (relevantRooms.length === 0) {
      await this.log(`no relevant rooms found`)

      throw new Error('no relevant rooms found')
    } else {
      // Prefer rooms with more participants, because that could mean we talk to more "backup" clients
      room = relevantRooms.reduce((previousRoom, currentRoom) =>
        currentRoom.members.length > previousRoom.members.length ? currentRoom : previousRoom
      )
      await this.log(
        `channel already open, reusing room ${room.id} with ${room.members.length} members`
      )
    }

    return room
  }

  private async log(...args: unknown[]): Promise<void> {
    if (this.debug) {
      console.log(`--- [P2PCommunicationClient]:${this.name}: `, ...args)
    }
  }
}
