import {
  Storage,
  StorageKey,
  TransportStatus,
  ExtendedP2PPairingResponse,
  NodeDistributions
} from '@mavrykdynamics/beacon-types'
import { Logger } from '@mavrykdynamics/beacon-core'
import { P2PTransport } from '@mavrykdynamics/beacon-transport-matrix'
import { KeyPair } from '@stablelib/ed25519'

const logger = new Logger('DappP2PTransport')

/**
 * @internalapi
 *
 *
 */
export class DappP2PTransport extends P2PTransport<
  ExtendedP2PPairingResponse,
  StorageKey.TRANSPORT_P2P_PEERS_DAPP
> {
  constructor(
    name: string,
    keyPair: KeyPair,
    storage: Storage,
    matrixNodes: NodeDistributions,
    iconUrl?: string,
    appUrl?: string
  ) {
    super(name, keyPair, storage, matrixNodes, StorageKey.TRANSPORT_P2P_PEERS_DAPP, iconUrl, appUrl)
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
