import {
  ExtendedP2PPairingResponse,
  Storage,
  StorageKey,
  TransportStatus
} from '@airgap/beacon-types'
import { WebSocketP2PTransport } from '@airgap/beacon-transport-libp2p'
import { Logger } from '@airgap/beacon-core'

const logger = new Logger('DappLibP2PTransport')

export class DappLibP2PTransport extends WebSocketP2PTransport<
  ExtendedP2PPairingResponse,
  StorageKey.TRANSPORT_LIBP2P_PEERS_DAPP
> {
  constructor(
    name: string,
    storage: Storage,
    urls?: string[]
  ) {
    super(name, storage, StorageKey.TRANSPORT_LIBP2P_PEERS_DAPP, urls)
  }

  public async startOpenChannelListener(): Promise<void> {
    return this.client.listenForChannelOpening(async (peer) => {
      logger.log('listenForNewPeer', `new publicKey`, peer.publicKey)

      await this.addPeer(peer)

      this._isConnected = TransportStatus.CONNECTED

      if (this.newPeerListener) {
        this.newPeerListener(peer)
        this.newPeerListener = undefined // TODO: Remove this once we use the id
      }
    })
  }

  public async listenForNewPeer(
    newPeerListener: (peer: ExtendedP2PPairingResponse) => void
  ): Promise<void> {
    logger.log('listenForNewPeer')
    this.newPeerListener = newPeerListener
  }

  public async stopListeningForNewPeers(): Promise<void> {
    logger.log('stopListeningForNewPeers')
    this.newPeerListener = undefined
  }
}
