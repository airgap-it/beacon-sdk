import { WebSocketP2PTransport } from '@airgap/beacon-transport-libp2p'
import { P2PPairingRequest, StorageKey, Storage, NodeDistributions } from '@airgap/beacon-types'

export class WalletWebSocketP2PTransport extends WebSocketP2PTransport<
  P2PPairingRequest,
  StorageKey.TRANSPORT_LIBP2P_PEERS_WALLET
> {
  constructor(name: string, storage: Storage, nodes?: NodeDistributions) {
    super(name, storage, StorageKey.TRANSPORT_LIBP2P_PEERS_WALLET, nodes)
  }

  public async addPeer(
    newPeer: P2PPairingRequest,
    sendPairingResponse: boolean = true
  ): Promise<void> {
    await super.addPeer(newPeer)
    if (sendPairingResponse) {
      await this.client.sendPairingResponse(newPeer) // TODO: Should we have a confirmation here?
    }
  }
}
