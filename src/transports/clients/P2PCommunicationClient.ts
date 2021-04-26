import * as sodium from 'libsodium-wrappers'

import axios from 'axios'
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

const clientNotReadyError = (): never => {
  throw new Error('Client not ready. Make sure to call "start" before you try to use it.')
}

/**
 * @internalapi
 *
 *
 */
export class P2PCommunicationClient extends CommunicationClient {
  private client: MatrixClient | undefined

  private initialEvent: MatrixClientEvent<MatrixClientEventType.MESSAGE> | undefined
  private initialListener:
    | ((event: MatrixClientEvent<MatrixClientEventType.MESSAGE>) => void)
    | undefined

  private readonly KNOWN_RELAY_SERVERS: string[]

  private readonly activeListeners: Map<string, (event: MatrixClientEvent<any>) => void> = new Map()

  private readonly ignoredRooms: string[] = []

  constructor(
    private readonly name: string,
    keyPair: sodium.KeyPair,
    public readonly replicationCount: number,
    private readonly storage: Storage,
    matrixNodes: string[],
    private readonly iconUrl?: string,
    private readonly appUrl?: string
  ) {
    super(keyPair)

    logger.log('constructor', 'P2PCommunicationClient created')
    this.KNOWN_RELAY_SERVERS = matrixNodes.length > 0 ? matrixNodes : KNOWN_RELAY_SERVERS
  }

  public async getPairingRequestInfo(): Promise<P2PPairingRequest> {
    const info: P2PPairingRequest = {
      id: await generateGUID(),
      type: 'p2p-pairing-request',
      name: this.name,
      version: BEACON_VERSION,
      publicKey: await this.getPublicKey(),
      relayServer: await this.getRelayServer()
    }

    if (this.iconUrl) {
      info.icon = this.iconUrl
    }
    if (this.appUrl) {
      info.appUrl = this.appUrl
    }

    return info
  }

  public async getPairingResponseInfo(request: P2PPairingRequest): Promise<P2PPairingResponse> {
    const info: P2PPairingResponse = {
      id: request.id,
      type: 'p2p-pairing-response',
      name: this.name,
      version: BEACON_VERSION,
      publicKey: await this.getPublicKey(),
      relayServer: await this.getRelayServer()
    }

    if (this.iconUrl) {
      info.icon = this.iconUrl
    }
    if (this.appUrl) {
      info.appUrl = this.appUrl
    }

    return info
  }

  public async getRelayServer(): Promise<string> {
    const node = await this.storage.get(StorageKey.MATRIX_SELECTED_NODE)
    if (node && node.length > 0) {
      return node
    }

    const startIndex = Math.floor(Math.random() * this.KNOWN_RELAY_SERVERS.length)
    let offset = 0

    while (offset < this.KNOWN_RELAY_SERVERS.length) {
      const serverIndex = (startIndex + offset) % this.KNOWN_RELAY_SERVERS.length
      const server = this.KNOWN_RELAY_SERVERS[serverIndex]

      try {
        await axios.get(`https://${server}/_matrix/client/versions`)
        this.storage
          .set(StorageKey.MATRIX_SELECTED_NODE, server)
          .catch((error) => logger.log(error))

        return server
      } catch (relayError) {
        logger.log(`Ignoring server "${server}", trying another one...`)
        offset++
      }
    }

    throw new Error(`No matrix server reachable!`)
  }

  public async tryJoinRooms(roomId: string, retry: number = 1): Promise<void> {
    if (!this.client) {
      throw clientNotReadyError()
    }

    try {
      await this.client.joinRooms(roomId)
    } catch (error) {
      if (retry <= 10 && error.errcode === 'M_FORBIDDEN') {
        // If we join the room too fast after receiving the invite, the server can accidentally reject our join. This seems to be a problem only when using a federated multi-node setup. Usually waiting for a couple milliseconds solves the issue, but to handle lag, we will keep retrying for 2 seconds.
        logger.log(`Retrying to join...`, error)
        setTimeout(async () => {
          await this.tryJoinRooms(roomId, retry + 1)
        }, 200)
      } else {
        logger.log(`Failed to join after ${retry} tries.`, error)
      }
    }
  }

  public async start(): Promise<void> {
    logger.log('start', 'starting client')

    await sodium.ready

    const loginRawDigest = sodium.crypto_generichash(
      32,
      sodium.from_string(`login:${Math.floor(Date.now() / 1000 / (5 * 60))}`)
    )
    const rawSignature = sodium.crypto_sign_detached(loginRawDigest, this.keyPair.privateKey)

    logger.log('start', `connecting to server`)

    const relayServer = await this.getRelayServer()

    const client = MatrixClient.create({
      baseUrl: `https://${relayServer}`,
      storage: this.storage
    })

    this.initialListener = async (
      event: MatrixClientEvent<MatrixClientEventType.MESSAGE>
    ): Promise<void> => {
      if (this.initialEvent && this.initialEvent.timestamp && event && event.timestamp) {
        if (this.initialEvent.timestamp < event.timestamp) {
          this.initialEvent = event
        }
      } else {
        this.initialEvent = event
      }
    }
    client.subscribe(MatrixClientEventType.MESSAGE, this.initialListener)

    client.subscribe(MatrixClientEventType.INVITE, async (event) => {
      await this.tryJoinRooms(event.content.roomId)
    })

    logger.log('start', 'login', await this.getPublicKeyHash(), 'on', relayServer)

    await client
      .start({
        id: await this.getPublicKeyHash(),
        password: `ed:${toHex(rawSignature)}:${await this.getPublicKey()}`,
        deviceId: toHex(this.keyPair.publicKey)
      })
      .catch((error) => logger.log(error))

    this.client = client
  }

  public async stop(): Promise<void> {
    if (this.client) {
      this.client.stop().catch((error) => logger.error(error))
      this.storage.delete(StorageKey.MATRIX_PEER_ROOM_IDS).catch((error) => logger.log(error))
      this.storage.delete(StorageKey.MATRIX_PRESERVED_STATE).catch((error) => logger.log(error))
      this.storage.delete(StorageKey.MATRIX_SELECTED_NODE).catch((error) => logger.log(error))
    }
  }

  public async listenForEncryptedMessage(
    senderPublicKey: string,
    messageCallback: (message: string) => void
  ): Promise<void> {
    if (!this.client) {
      throw clientNotReadyError()
    }

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

            // logger.log(
            //   'listenForEncryptedMessage',
            //   'encrypted message received',
            //   decryptedMessage,
            //   await new Serializer().deserialize(decryptedMessage)
            // )
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

    this.client.subscribe(MatrixClientEventType.MESSAGE, callbackFunction)

    const lastEvent = this.initialEvent
    if (
      lastEvent &&
      lastEvent.timestamp &&
      new Date().getTime() - lastEvent.timestamp < 5 * 60 * 1000
    ) {
      logger.log('listenForEncryptedMessage', 'Handling previous event')
      await callbackFunction(lastEvent)
    } else {
      logger.log('listenForEncryptedMessage', 'No previous event found')
    }

    if (this.initialListener) {
      this.client.unsubscribe(MatrixClientEventType.MESSAGE, this.initialListener)
    }
    this.initialListener = undefined
    this.initialEvent = undefined
  }

  public async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    if (!this.client) {
      throw clientNotReadyError()
    }

    const listener = this.activeListeners.get(senderPublicKey)
    if (!listener) {
      return
    }

    this.client.unsubscribe(MatrixClientEventType.MESSAGE, listener)

    this.activeListeners.delete(senderPublicKey)
  }

  public async unsubscribeFromEncryptedMessages(): Promise<void> {
    if (!this.client) {
      throw clientNotReadyError()
    }

    this.client.unsubscribe(MatrixClientEventType.MESSAGE)

    this.activeListeners.clear()
  }

  public async sendMessage(
    message: string,
    peer: P2PPairingRequest | ExtendedP2PPairingResponse
  ): Promise<void> {
    if (!this.client) {
      throw clientNotReadyError()
    }

    const { sharedTx } = await this.createCryptoBoxClient(peer.publicKey, this.keyPair.privateKey)

    const recipientHash: string = await getHexHash(Buffer.from(peer.publicKey, 'hex'))
    const recipient = recipientString(recipientHash, peer.relayServer)

    const roomId = await this.getRelevantRoom(recipient)

    const encryptedMessage = await encryptCryptoboxPayload(message, sharedTx)

    // logger.log(
    //   'sendMessage',
    //   'sending encrypted message',
    //   peer.publicKey,
    //   roomId,
    //   message,
    //   await new Serializer().deserialize(message)
    // )

    this.client.sendTextMessage(roomId, encryptedMessage).catch(async (error) => {
      if (error.errcode === 'M_FORBIDDEN') {
        // Room doesn't exist
        logger.log(`sendMessage`, `M_FORBIDDEN`, error)
        await this.deleteRoomIdFromRooms(roomId)
        const newRoomId = await this.getRelevantRoom(recipient)

        if (!this.client) {
          throw clientNotReadyError()
        }
        this.client.sendTextMessage(newRoomId, encryptedMessage).catch(async (error2) => {
          logger.log(`sendMessage`, `inner error`, error2)
        })
      } else {
        logger.log(`sendMessage`, `not forbidden`, error)
      }
    })
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

    // TODO: We also need to delete the room from the sync state
    // If we need to delete a room, we can assume the local state is not up to date anymore, so we can reset the state

    this.ignoredRooms.push(roomId)
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: ExtendedP2PPairingResponse) => void
  ): Promise<void> {
    if (!this.client) {
      throw clientNotReadyError()
    }

    this.client.subscribe(MatrixClientEventType.MESSAGE, async (event) => {
      if (this.isTextMessage(event.content) && (await this.isChannelOpenMessage(event.content))) {
        logger.log(`listenForChannelOpening`, `channel opening`, JSON.stringify(event))

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

  public async waitForJoin(roomId: string, retry: number = 0): Promise<void> {
    if (!this.client) {
      throw clientNotReadyError()
    }

    // Rooms are updated as new events come in. `client.getRoomById` only accesses memory, it does not do any network requests.
    // TODO: Improve to listen to "JOIN" event
    const room = await this.client.getRoomById(roomId)
    logger.log(`waitForJoin`, `Currently ${room.members.length} members, we need at least 2`)
    if (room.members.length >= 2 || room.members.length === 0) {
      // 0 means it's an unknown room, we don't need to wait
      return
    } else {
      if (retry <= 200) {
        // On mobile, due to app switching, we potentially have to wait for a long time
        logger.log(`Waiting for join... Try: ${retry}`)

        return new Promise((resolve) => {
          setTimeout(async () => {
            resolve(this.waitForJoin(roomId, retry + 1))
          }, 100 * (retry > 50 ? 10 : 1)) // After the initial 5 seconds, retry only once per second
        })
      } else {
        throw new Error(`No one joined after ${retry} tries.`)
      }
    }
  }

  public async sendPairingResponse(pairingRequest: P2PPairingRequest): Promise<void> {
    if (!this.client) {
      throw clientNotReadyError()
    }

    logger.log(`sendPairingResponse`)
    const recipientHash = await getHexHash(Buffer.from(pairingRequest.publicKey, 'hex'))
    const recipient = recipientString(recipientHash, pairingRequest.relayServer)

    const roomId = await this.getRelevantRoom(recipient)

    // Before we send the message, we have to wait for the join to be accepted.
    await this.waitForJoin(roomId)

    // TODO: remove v1 backwards-compatibility
    const message: string =
      typeof pairingRequest.version === 'undefined'
        ? await this.getPublicKey() // v1
        : JSON.stringify(await this.getPairingResponseInfo(pairingRequest)) // v2

    const encryptedMessage: string = await this.encryptMessageAsymmetric(
      pairingRequest.publicKey,
      message
    )

    const msg = ['@channel-open', recipient, encryptedMessage].join(':')
    this.client.sendTextMessage(roomId, msg).catch(async (error) => {
      if (error.errcode === 'M_FORBIDDEN') {
        // Room doesn't exist
        logger.log(`sendMessage`, `M_FORBIDDEN`, error)
        await this.deleteRoomIdFromRooms(roomId)
        const newRoomId = await this.getRelevantRoom(recipient)

        if (!this.client) {
          throw clientNotReadyError()
        }
        this.client.sendTextMessage(newRoomId, msg).catch(async (error2) => {
          logger.log(`sendMessage`, `inner error`, error2)
        })
      } else {
        logger.log(`sendMessage`, `not forbidden`, error)
      }
    })
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

  private async getRelevantRoom(recipient: string): Promise<string> {
    const roomIds = await this.storage.get(StorageKey.MATRIX_PEER_ROOM_IDS)
    let roomId = roomIds[recipient]

    if (!roomId) {
      logger.log(`getRelevantRoom`, `No room found for peer ${recipient}, checking joined ones.`)
      const room = await this.getRelevantJoinedRoom(recipient)
      roomId = room.id
      roomIds[recipient] = room.id
      await this.storage.set(StorageKey.MATRIX_PEER_ROOM_IDS, roomIds)
    }

    logger.log(`getRelevantRoom`, `Using room ${roomId}`)

    return roomId
  }

  private async getRelevantJoinedRoom(recipient: string): Promise<MatrixRoom> {
    if (!this.client) {
      throw clientNotReadyError()
    }

    const joinedRooms = await this.client.joinedRooms
    logger.log('checking joined rooms', joinedRooms, recipient)
    const relevantRooms = joinedRooms
      .filter((roomElement: MatrixRoom) => !this.ignoredRooms.some((id) => roomElement.id === id))
      .filter((roomElement: MatrixRoom) =>
        roomElement.members.some((member: string) => member === recipient)
      )

    let room: MatrixRoom
    // We always create a new room if one has been ignored. This is because if we ignore one, we know the server state changed.
    // So we cannot trust the current sync state. This can be removed once we have a method to properly clear and refresh the sync state.
    if (relevantRooms.length === 0 || this.ignoredRooms.length > 0) {
      logger.log(`getRelevantJoinedRoom`, `no relevant rooms found, creating new one`)

      const roomId = await this.client.createTrustedPrivateRoom(recipient)
      room = await this.client.getRoomById(roomId)
      logger.log(`getRelevantJoinedRoom`, `new room created and peer invited: ${room.id}`)
    } else {
      room = relevantRooms[0]
      logger.log(`getRelevantJoinedRoom`, `channel already open, reusing room ${room.id}`)
    }

    return room
  }
}
