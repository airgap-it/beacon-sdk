import { Logger, PeerManager, Transport } from '@airgap/beacon-core'
import { WebSocketP2PCommunicationClient } from './communication-client/WebSocketP2PCommunicationClient'
import {
  P2PPairingRequest,
  ExtendedP2PPairingResponse,
  Storage,
  StorageKey,
  Origin,
  TransportType,
  PeerInfo
} from '@airgap/beacon-types'

const DEFAULT_NODES = ['wss://websocket-proxy-1.prod.gke.acurast.com', 'wss://websocket-proxy-2.prod.gke.acurast.com']
const logger = new Logger('P2PTransport')

export abstract class WebSocketP2PTransport<
  T extends P2PPairingRequest | ExtendedP2PPairingResponse,
  K extends StorageKey.TRANSPORT_LIBP2P_PEERS_DAPP | StorageKey.TRANSPORT_LIBP2P_PEERS_WALLET
> extends Transport<T, K, WebSocketP2PCommunicationClient> {
  public readonly type: TransportType = TransportType.LIBP2P
  constructor(
    name: string,
    storage: Storage,
    storageKey: K,
    urls: string[] = DEFAULT_NODES
  ) {
    super(
      name,
      new WebSocketP2PCommunicationClient(name, urls),
      new PeerManager(storage, storageKey)
    )
  }

  async connect() {
    await this.client.connect()

    const knownPeers = await this.getPeers()

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async (peer) => this.listen(peer.publicKey))
      Promise.all(connectionPromises).catch((error) => logger.error('connect', error))
    }

    await this.startOpenChannelListener()
    return super.connect()
  }

  async send(message: string, peer?: PeerInfo): Promise<void> {
    if (peer) {
      return this.client.sendRequest(peer.publicKey, message)
    } else {
      const knownPeers = await this.getPeers()
      // A broadcast request has to be sent everywhere.
      const promises = knownPeers.map((peerEl) =>
        this.client.sendRequest(peerEl.publicKey, message)
      )

      return (await Promise.all(promises))[0]
    }
  }

  async startOpenChannelListener() {
    return
  }

  async disconnect(): Promise<void> {
    await this.client.close()
    return super.disconnect()
  }

  public getPairingRequestInfo(): Promise<P2PPairingRequest> {
    return this.client.getPairingRequestInfo()
  }

  async listen(publicKey: string): Promise<void> {
    this.client.listenForEncryptedMessage(publicKey, (message) =>
      this.notifyListeners(message, {
        origin: Origin.LIBP2P,
        id: publicKey
      })
    )
  }
}
