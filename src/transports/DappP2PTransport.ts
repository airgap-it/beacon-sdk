import * as sodium from 'libsodium-wrappers'
import { Storage, StorageKey, P2PTransport, TransportStatus } from '..'
import { ExtendedP2PPairingResponse } from '../types/P2PPairingResponse'
import { Logger } from '../utils/Logger'

const logger = new Logger('DappP2PTransport')

export class DappP2PTransport extends P2PTransport<
  ExtendedP2PPairingResponse,
  StorageKey.TRANSPORT_P2P_PEERS_DAPP
> {
  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage, matrixNodes: string[]) {
    super(name, keyPair, storage, matrixNodes, StorageKey.TRANSPORT_P2P_PEERS_DAPP)
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
