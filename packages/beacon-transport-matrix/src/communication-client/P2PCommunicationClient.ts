import { sign } from '@stablelib/ed25519'
import axios from 'axios'
import {
  getHexHash,
  toHex,
  recipientString,
  openCryptobox,
  encryptCryptoboxPayload,
  decryptCryptoboxPayload,
  secretbox_NONCEBYTES,
  secretbox_MACBYTES
} from '@airgap/beacon-utils'
import { MatrixClient } from '../matrix-client/MatrixClient'
import {
  MatrixClientEvent,
  MatrixClientEventType,
  MatrixClientEventMessageContent
} from '../matrix-client/models/MatrixClientEvent'
import { MatrixMessageType } from '../matrix-client/models/MatrixMessage'
import { MatrixRoom } from '../matrix-client/models/MatrixRoom'
import {
  Storage,
  P2PPairingRequest,
  StorageKey,
  ExtendedP2PPairingResponse,
  P2PPairingResponse,
  NodeDistributions,
  Regions
} from '@airgap/beacon-types'
import {
  PeerManager,
  BEACON_VERSION,
  getSenderId,
  Logger,
  CommunicationClient
} from '@airgap/beacon-core'
import { ExposedPromise, generateGUID } from '@airgap/beacon-utils'
import { KeyPair } from '@stablelib/ed25519'
import { hash } from '@stablelib/blake2b'
import { encode } from '@stablelib/utf8'

const logger = new Logger('P2PCommunicationClient')

const REGIONS_AND_SERVERS: NodeDistributions = {
  [Regions.EUROPE_WEST]: [
    'beacon-node-1.diamond.papers.tech',
    'beacon-node-1.sky.papers.tech',
    'beacon-node-2.sky.papers.tech',
    'beacon-node-1.hope.papers.tech',
    'beacon-node-1.hope-2.papers.tech',
    'beacon-node-1.hope-3.papers.tech',
    'beacon-node-1.hope-4.papers.tech',
    'beacon-node-1.hope-5.papers.tech'
  ]
}

interface BeaconInfoResponse {
  region: string
  known_servers: string[]
  timestamp: number
}

/**
 * @internalapi
 */
export class P2PCommunicationClient extends CommunicationClient {
  private client: ExposedPromise<MatrixClient> = new ExposedPromise()

  private initialEvent: MatrixClientEvent<MatrixClientEventType.MESSAGE> | undefined
  private initialListener:
    | ((event: MatrixClientEvent<MatrixClientEventType.MESSAGE>) => void)
    | undefined

  private selectedRegion?: Regions
  private readonly ENABLED_RELAY_SERVERS: NodeDistributions
  public relayServer:
    | ExposedPromise<{ server: string; timestamp: number; localTimestamp: number }>
    | undefined

  private readonly activeListeners: Map<string, (event: MatrixClientEvent<any>) => void> = new Map()

  private readonly ignoredRooms: string[] = []
  private loginCounter: number = 0

  constructor(
    private readonly name: string,
    keyPair: KeyPair,
    public readonly replicationCount: number,
    private readonly storage: Storage,
    matrixNodes?: NodeDistributions,
    private readonly iconUrl?: string,
    private readonly appUrl?: string
  ) {
    super(keyPair)

    logger.log('constructor', 'P2PCommunicationClient created')

    this.ENABLED_RELAY_SERVERS = REGIONS_AND_SERVERS

    if (matrixNodes) {
      this.ENABLED_RELAY_SERVERS = {
        ...REGIONS_AND_SERVERS,
        ...matrixNodes
      }
    }
  }

  public async getPairingRequestInfo(): Promise<P2PPairingRequest> {
    const info: P2PPairingRequest = {
      id: await generateGUID(),
      type: 'p2p-pairing-request',
      name: this.name,
      version: BEACON_VERSION,
      publicKey: await this.getPublicKey(),
      relayServer: (await this.getRelayServer()).server
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
      version: request.version,
      publicKey: await this.getPublicKey(),
      relayServer: (await this.getRelayServer()).server
    }

    if (this.iconUrl) {
      info.icon = this.iconUrl
    }
    if (this.appUrl) {
      info.appUrl = this.appUrl
    }

    return info
  }

  public async findBestRegion(): Promise<Regions> {
    if (this.selectedRegion) {
      return this.selectedRegion
    }

    const keys: Regions[] = Object.keys(this.ENABLED_RELAY_SERVERS) as any

    const allPromises: Promise<{
      region: Regions
      server: string
      response: BeaconInfoResponse
    }>[] = []

    keys.forEach((key) => {
      const nodes = this.ENABLED_RELAY_SERVERS[key] ?? []

      const index = Math.floor(Math.random() * nodes.length)
      allPromises.push(
        this.getBeaconInfo(nodes[index])
          .then((res) => ({
            region: key,
            server: nodes[index],
            response: res
          }))
          .catch(
            (err) =>
              new Promise((_resolve, reject) => {
                // This workaround is done because Promise.race stops at the first failure, but we need the first success.
                // TODO: If all promises have been rejected, let's not wait 2000 and abort earlier.
                setTimeout(() => reject(err), 2000)
              })
          )
      )
    })

    const region = await Promise.race(allPromises)
    this.selectedRegion = region.region

    return region.region

    // Select random server from each region.
    // Start request to random server from each region
    // Fastest response wins, region is selected
  }

  public async getRelayServer(): Promise<{ server: string; timestamp: number }> {
    if (this.relayServer) {
      const relayServer = await this.relayServer.promise

      // We make sure the locally cached timestamp is not older than 1 minute, if it is, we refresh it
      if (Date.now() - relayServer.localTimestamp < 60 * 1000) {
        return { server: relayServer.server, timestamp: relayServer.timestamp }
      }

      const info = await this.getBeaconInfo(relayServer.server)
      this.relayServer.resolve({
        server: relayServer.server,
        timestamp: info.timestamp,
        localTimestamp: new Date().getTime()
      })
      return { server: relayServer.server, timestamp: info.timestamp }
    } else {
      this.relayServer = new ExposedPromise()
    }

    const node = await this.storage.get(StorageKey.MATRIX_SELECTED_NODE)
    if (node && node.length > 0) {
      const info = await this.getBeaconInfo(node)
      this.relayServer.resolve({
        server: node,
        timestamp: info.timestamp,
        localTimestamp: new Date().getTime()
      })
      return { server: node, timestamp: info.timestamp }
    }

    const region = await this.findBestRegion()

    const regionNodes = this.ENABLED_RELAY_SERVERS[region]
    if (!regionNodes) {
      throw new Error(`No servers found for region ${region}`)
    }

    const nodes = [...regionNodes]

    while (nodes.length > 0) {
      const index = Math.floor(Math.random() * nodes.length)
      const server = nodes[index]

      try {
        const response = await this.getBeaconInfo(server)
        this.storage
          .set(StorageKey.MATRIX_SELECTED_NODE, server)
          .catch((error) => logger.log(error))

        this.relayServer.resolve({
          server,
          timestamp: response.timestamp,
          localTimestamp: new Date().getTime()
        })
        return { server, timestamp: response.timestamp }
      } catch (relayError) {
        logger.log(`Ignoring server "${server}", trying another one...`)
        nodes.splice(index, 1)
      }
    }

    this.relayServer.reject(`No matrix server reachable!`)
    throw new Error(`No matrix server reachable!`)
  }

  public async getBeaconInfo(server: string): Promise<BeaconInfoResponse> {
    return axios
      .get<BeaconInfoResponse>(`https://${server}/_synapse/client/beacon/info`)
      .then((res) => ({
        region: res.data.region,
        known_servers: res.data.known_servers,
        timestamp: Math.floor(res.data.timestamp)
      }))
  }

  public async tryJoinRooms(roomId: string, retry: number = 1): Promise<void> {
    try {
      await (await this.client.promise).joinRooms(roomId)
    } catch (error) {
      if (retry <= 10 && (error as any).errcode === 'M_FORBIDDEN') {
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

    logger.log('start', `connecting to server`)

    const relayServer: { server: string; timestamp: number } = await this.getRelayServer()

    const client = MatrixClient.create({
      baseUrl: `https://${relayServer.server}`,
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
      let member
      if (event.content.members.length === 1) {
        // If there is only one member we know it's a new room
        // TODO: Use the "sender" of the event instead
        member = event.content.members[0]
      }

      await this.tryJoinRooms(event.content.roomId)

      if (member) {
        await this.updateRelayServer(member)
        await this.updatePeerRoom(member, event.content.roomId)
      }
    })

    if (!relayServer.timestamp) {
      throw new Error('No timestamp received from relay server')
    }

    const time = Math.floor(relayServer.timestamp)

    const loginString = `login:${Math.floor(time / (5 * 60))}`

    logger.log(
      'start',
      `login ${loginString}, ${await this.getPublicKeyHash()} on ${relayServer.server}`
    )

    const loginRawDigest = hash(encode(loginString), 32)

    const secretKey = this.keyPair.secretKey ?? (this.keyPair as any).privateKey

    const rawSignature = sign(secretKey, loginRawDigest)

    try {
      await client.start({
        id: await this.getPublicKeyHash(),
        password: `ed:${toHex(rawSignature)}:${await this.getPublicKey()}`,
        deviceId: toHex(this.keyPair.publicKey)
      })
    } catch (error) {
      logger.error('start', 'Could not log in, retrying')
      await this.reset() // If we can't log in, let's reset
      if (!this.selectedRegion) {
        throw new Error('No region selected.')
      }
      if (this.loginCounter <= (this.ENABLED_RELAY_SERVERS[this.selectedRegion] ?? []).length) {
        this.loginCounter++
        this.start()
        return
      } else {
        logger.error(
          'start',
          'Tried to log in to every known beacon node, but no login was successful.'
        )

        throw new Error('Could not connect to any beacon nodes. Try again later.')
      }
    }

    logger.log('start', 'login successful, client is ready')
    this.client.resolve(client)
  }

  public async stop(): Promise<void> {
    logger.log('stop', 'stopping client')

    if (this.client.isResolved()) {
      await (await this.client.promise).stop().catch((error) => logger.error(error))
    }
    await this.reset()
  }

  public async reset(): Promise<void> {
    logger.log('reset', 'resetting connection')

    await this.storage.delete(StorageKey.MATRIX_PEER_ROOM_IDS).catch((error) => logger.log(error))
    await this.storage.delete(StorageKey.MATRIX_PRESERVED_STATE).catch((error) => logger.log(error))
    await this.storage.delete(StorageKey.MATRIX_SELECTED_NODE).catch((error) => logger.log(error))
    // Instead of resetting everything, maybe we should make sure a new instance is created?
    this.relayServer = undefined
    this.client = new ExposedPromise()
    this.initialEvent = undefined
    this.initialListener = undefined
  }

  public async listenForEncryptedMessage(
    senderPublicKey: string,
    messageCallback: (message: string) => void
  ): Promise<void> {
    if (this.activeListeners.has(senderPublicKey)) {
      return
    }
    logger.log(
      'listenForEncryptedMessage',
      `start listening for encrypted messages from publicKey ${senderPublicKey}`
    )

    const sharedKey = await this.createCryptoBoxServer(senderPublicKey, this.keyPair)

    const callbackFunction = async (
      event: MatrixClientEvent<MatrixClientEventType.MESSAGE>
    ): Promise<void> => {
      if (this.isTextMessage(event.content) && (await this.isSender(event, senderPublicKey))) {
        let payload

        await this.updateRelayServer(event.content.message.sender)
        await this.updatePeerRoom(event.content.message.sender, event.content.roomId)

        try {
          payload = Buffer.from(event.content.message.content, 'hex')
          // content can be non-hex if it's a connection open request
        } catch {
          /* */
        }
        if (payload && payload.length >= secretbox_NONCEBYTES + secretbox_MACBYTES) {
          try {
            const decryptedMessage = await decryptCryptoboxPayload(payload, sharedKey.receive)

            logger.log(
              'listenForEncryptedMessage',
              `received a message from ${senderPublicKey}`,
              decryptedMessage
            )

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
    ;(await this.client.promise).subscribe(MatrixClientEventType.MESSAGE, callbackFunction)

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

    const initialListener = this.initialListener
    if (initialListener) {
      ;(await this.client.promise).unsubscribe(MatrixClientEventType.MESSAGE, initialListener)
    }
    this.initialListener = undefined
    this.initialEvent = undefined
  }

  public async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    const listener = this.activeListeners.get(senderPublicKey)
    if (!listener) {
      return
    }

    ;(await this.client.promise).unsubscribe(MatrixClientEventType.MESSAGE, listener)

    this.activeListeners.delete(senderPublicKey)
  }

  public async unsubscribeFromEncryptedMessages(): Promise<void> {
    ;(await this.client.promise).unsubscribeAll(MatrixClientEventType.MESSAGE)

    this.activeListeners.clear()
  }

  public async sendMessage(
    message: string,
    peer: P2PPairingRequest | ExtendedP2PPairingResponse
  ): Promise<void> {
    const sharedKey = await this.createCryptoBoxClient(peer.publicKey, this.keyPair)

    const recipientHash: string = await getHexHash(Buffer.from(peer.publicKey, 'hex'))
    const recipient = recipientString(recipientHash, peer.relayServer)

    const roomId = await this.getRelevantRoom(recipient)

    // Before we send the message, we have to wait for the join to be accepted.
    await this.waitForJoin(roomId) // TODO: This can probably be removed because we are now waiting inside the get room method

    const encryptedMessage = await encryptCryptoboxPayload(message, sharedKey.send)

    logger.log('sendMessage', 'sending encrypted message', peer.publicKey, roomId, message)
    ;(await this.client.promise).sendTextMessage(roomId, encryptedMessage).catch(async (error) => {
      if (error.errcode === 'M_FORBIDDEN') {
        // Room doesn't exist
        logger.log(`sendMessage`, `M_FORBIDDEN`, roomId, error)
        await this.deleteRoomIdFromRooms(roomId)
        const newRoomId = await this.getRelevantRoom(recipient)
        logger.log(`sendMessage`, `Old room deleted, new room created`, newRoomId)
        ;(await this.client.promise)
          .sendTextMessage(newRoomId, encryptedMessage)
          .catch(async (error2) => {
            logger.log(`sendMessage`, `inner error`, newRoomId, error2)
          })
      } else {
        logger.log(`sendMessage`, `unexpected error`, error)
      }
    })
  }

  public async updatePeerRoom(sender: string, roomId: string): Promise<void> {
    logger.log(`updatePeerRoom`, sender, roomId)

    // Sender is in the format "@pubkeyhash:relayserver.tld"
    const split = sender.split(':')
    if (split.length < 2 || !split[0].startsWith('@')) {
      throw new Error('Invalid sender')
    }

    const roomIds = await this.storage.get(StorageKey.MATRIX_PEER_ROOM_IDS)

    const room = roomIds[sender]

    if (room === roomId) {
      logger.debug(`updatePeerRoom`, `rooms are the same, not updating`)
    }

    logger.debug(`updatePeerRoom`, `current room`, room, 'new room', roomId)

    if (room && room[1]) {
      // If we have a room already, let's ignore it. We need to do this, otherwise it will be loaded from the matrix cache.
      logger.log(`updatePeerRoom`, `adding room "${room[1]}" to ignored array`)

      this.ignoredRooms.push(room[1])
    }

    roomIds[sender] = roomId

    await this.storage.set(StorageKey.MATRIX_PEER_ROOM_IDS, roomIds)

    // TODO: We also need to delete the room from the sync state
    // If we need to delete a room, we can assume the local state is not up to date anymore, so we can reset the state
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
    logger.debug(`listenForChannelOpening`)
    ;(await this.client.promise).subscribe(MatrixClientEventType.MESSAGE, async (event) => {
      if (this.isTextMessage(event.content) && (await this.isChannelOpenMessage(event.content))) {
        logger.log(
          `listenForChannelOpening`,
          `channel opening received, trying to decrypt`,
          JSON.stringify(event)
        )

        await this.updateRelayServer(event.content.message.sender)
        await this.updatePeerRoom(event.content.message.sender, event.content.roomId)

        const splits = event.content.message.content.split(':')
        const payload = Buffer.from(splits[splits.length - 1], 'hex')

        if (payload.length >= secretbox_NONCEBYTES + secretbox_MACBYTES) {
          try {
            const pairingResponse: P2PPairingResponse = JSON.parse(
              await openCryptobox(payload, this.keyPair.publicKey, this.keyPair.secretKey)
            )

            logger.log(
              `listenForChannelOpening`,
              `channel opening received and decrypted`,
              JSON.stringify(pairingResponse)
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
    // Rooms are updated as new events come in. `client.getRoomById` only accesses memory, it does not do any network requests.
    // TODO: Improve to listen to "JOIN" event
    const room = await (await this.client.promise).getRoomById(roomId)
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
    logger.log(`sendPairingResponse`)
    const recipientHash = await getHexHash(Buffer.from(pairingRequest.publicKey, 'hex'))
    const recipient = recipientString(recipientHash, pairingRequest.relayServer)

    // We force room creation here because if we "re-pair", we need to make sure that we don't send it to an old room.
    const roomId = await (await this.client.promise).createTrustedPrivateRoom(recipient)
    logger.debug(`sendPairingResponse`, `Connecting to room "${roomId}"`)

    await this.updatePeerRoom(recipient, roomId)

    // Before we send the message, we have to wait for the join to be accepted.
    await this.waitForJoin(roomId) // TODO: This can probably be removed because we are now waiting inside the get room method

    logger.debug(`sendPairingResponse`, `Successfully joined room.`)

    // TODO: remove v1 backwards-compatibility
    const message: string =
      typeof pairingRequest.version === 'undefined'
        ? await this.getPublicKey() // v1
        : JSON.stringify(await this.getPairingResponseInfo(pairingRequest)) // v2

    logger.debug(`sendPairingResponse`, `Sending pairing response`, message)

    const encryptedMessage: string = await this.encryptMessageAsymmetric(
      pairingRequest.publicKey,
      message
    )

    const msg = ['@channel-open', recipient, encryptedMessage].join(':')
    ;(await this.client.promise).sendTextMessage(roomId, msg).catch(async (error) => {
      if (error.errcode === 'M_FORBIDDEN') {
        // Room doesn't exist
        logger.log(`sendPairingResponse`, `M_FORBIDDEN`, roomId, error)
        await this.deleteRoomIdFromRooms(roomId)
        const newRoomId = await this.getRelevantRoom(recipient)
        logger.log(`sendPairingResponse`, `Old room deleted, new room created`, newRoomId)
        ;(await this.client.promise).sendTextMessage(newRoomId, msg).catch(async (error2) => {
          logger.log(`sendPairingResponse`, `inner error`, newRoomId, error2)
        })
      } else {
        logger.log(`sendPairingResponse`, `unexpected error`, error)
      }
    })
  }

  public isTextMessage(
    content: MatrixClientEventMessageContent<any>
  ): content is MatrixClientEventMessageContent<string> {
    return content.message.type === MatrixMessageType.TEXT
  }

  public async updateRelayServer(sender: string) {
    logger.log(`updateRelayServer`, sender)

    // Sender is in the format "@pubkeyhash:relayserver.tld"
    const split = sender.split(':')
    if (split.length < 2 || !split[0].startsWith('@')) {
      throw new Error('Invalid sender')
    }
    const senderHash = split.shift()
    const relayServer = split.join(':')
    const manager = localStorage.getItem('beacon:communication-peers-dapp')
      ? new PeerManager(this.storage, StorageKey.TRANSPORT_P2P_PEERS_DAPP)
      : new PeerManager(this.storage, StorageKey.TRANSPORT_P2P_PEERS_WALLET)
    const peers = await manager.getPeers()
    const promiseArray = (peers as any).map(
      async (peer: P2PPairingRequest | ExtendedP2PPairingResponse) => {
        const hash = `@${await getHexHash(Buffer.from(peer.publicKey, 'hex'))}`
        if (hash === senderHash) {
          if (peer.relayServer !== relayServer) {
            peer.relayServer = relayServer
            await manager.addPeer(peer as any)
          }
        }
      }
    )
    await Promise.all(promiseArray)
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
    const joinedRooms = await (await this.client.promise).joinedRooms
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

      const roomId = await (await this.client.promise).createTrustedPrivateRoom(recipient)
      room = await (await this.client.promise).getRoomById(roomId)
      logger.log(`getRelevantJoinedRoom`, `waiting for other party to join room: ${room.id}`)
      await this.waitForJoin(roomId)
      logger.log(`getRelevantJoinedRoom`, `new room created and peer invited: ${room.id}`)
    } else {
      room = relevantRooms[0]
      logger.log(`getRelevantJoinedRoom`, `channel already open, reusing room ${room.id}`)
    }

    return room
  }
}
