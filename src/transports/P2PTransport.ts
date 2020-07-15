import * as sodium from 'libsodium-wrappers'
import { Logger } from '../utils/Logger'
import { ConnectionContext } from '../types/ConnectionContext'
import {
  Storage,
  StorageKey,
  TransportStatus,
  Transport,
  TransportType,
  P2PCommunicationClient,
  Origin,
  P2PPairingRequest
} from '..'
import { BeaconEventHandler, BeaconEvent } from '../events'
import { PeerManager } from '../managers/PeerManager'

const logger = new Logger('P2PTransport')

export class P2PTransport extends Transport {
  public readonly type: TransportType = TransportType.P2P
  private readonly events: BeaconEventHandler

  private readonly isDapp: boolean = true
  private readonly storage: Storage
  private readonly keyPair: sodium.KeyPair

  private readonly client: P2PCommunicationClient

  // Make sure we only listen once
  private listeningForChannelOpenings: boolean = false

  private readonly peerManager: PeerManager

  constructor(
    name: string,
    keyPair: sodium.KeyPair,
    storage: Storage,
    events: BeaconEventHandler,
    isDapp: boolean
  ) {
    super(name)
    this.keyPair = keyPair
    this.storage = storage
    this.events = events
    this.isDapp = isDapp
    this.client = new P2PCommunicationClient(this.name, this.keyPair, 1, false, storage)
    this.peerManager = new PeerManager(storage, StorageKey.TRANSPORT_P2P_PEERS)
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  public async connect(): Promise<void> {
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTING

    await this.client.start()

    const knownPeers = await this.peerManager.getPeers()

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async (peer) => this.listen(peer.publicKey))
      await Promise.all(connectionPromises)
    } else {
      if (this.isDapp) {
        await this.connectNewPeer()
      }
    }

    await super.connect()
  }

  public async reconnect(): Promise<void> {
    if (this.isDapp) {
      await this.connectNewPeer()
    }
  }

  public async connectNewPeer(): Promise<void> {
    logger.log('connectNewPeer')

    return new Promise(async (resolve) => {
      if (!this.listeningForChannelOpenings) {
        await this.client.listenForChannelOpening(async (publicKey) => {
          logger.log('connectNewPeer', `new publicKey ${publicKey}`)

          const newPeer = { name: '', publicKey, relayServer: '' }

          if (!(await this.peerManager.hasPeer(publicKey))) {
            await this.peerManager.addPeer(newPeer)
            await this.listen(publicKey)
          }

          this.events
            .emit(BeaconEvent.P2P_CHANNEL_CONNECT_SUCCESS, newPeer)
            .catch((emitError) => console.warn(emitError))

          resolve()
        })
        this.listeningForChannelOpenings = true
      }

      this.events
        .emit(BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN, await this.client.getHandshakeInfo())
        .catch((emitError) => console.warn(emitError))
    })
  }

  public async getPeers(): Promise<P2PPairingRequest[]> {
    return (await this.peerManager.getPeers()) as P2PPairingRequest[]
  }

  public async addPeer(newPeer: P2PPairingRequest): Promise<void> {
    if (!(await this.peerManager.hasPeer(newPeer.publicKey))) {
      logger.log('addPeer', newPeer)
      await this.peerManager.addPeer(newPeer)
      await this.listen(newPeer.publicKey) // TODO: Prevent channels from being opened multiple times
    } else {
      logger.log('addPeer', 'peer already added, skipping', newPeer)
    }
    await this.client.openChannel(newPeer.publicKey, newPeer.relayServer) // TODO: Should we have a confirmation here?
  }

  public async removePeer(peerToBeRemoved: P2PPairingRequest): Promise<void> {
    logger.log('removePeer', peerToBeRemoved)
    await this.peerManager.removePeer(peerToBeRemoved.publicKey)
    if (this.client) {
      await this.client.unsubscribeFromEncryptedMessage(peerToBeRemoved.publicKey)
    }
  }

  public async removeAllPeers(): Promise<void> {
    logger.log('removeAllPeers')
    await this.peerManager.removeAllPeers()

    await this.client.unsubscribeFromEncryptedMessages()
  }

  public async send(message: string, recipient?: string): Promise<void> {
    const knownPeers = await this.storage.get(StorageKey.TRANSPORT_P2P_PEERS)

    if (recipient) {
      if (!knownPeers.some((peer) => peer.publicKey === recipient)) {
        throw new Error('Recipient unknown')
      }

      return this.client.sendMessage(recipient, message)
    } else {
      // A broadcast request has to be sent everywhere.
      const promises = knownPeers.map((peer) => this.client.sendMessage(peer.publicKey, message))

      return (await Promise.all(promises))[0]
    }
  }

  private async listen(publicKey: string): Promise<void> {
    await this.client
      .listenForEncryptedMessage(publicKey, (message) => {
        const connectionContext: ConnectionContext = {
          origin: Origin.P2P,
          id: publicKey
        }

        this.notifyListeners(message, connectionContext).catch((error) => {
          throw error
        })
      })
      .catch((error) => {
        throw error
      })
  }
}
