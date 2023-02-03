import {
  StorageKey,
  Storage,
  ExtendedPostMessagePairingResponse,
  ExtendedWalletConnectPairingResponse
} from '@airgap/beacon-types'
import { Logger } from '@airgap/beacon-core'
import { WalletConnectTransport } from '@airgap/beacon-transport-walletconnect'
import { KeyPair } from '@stablelib/ed25519'

const logger = new Logger('DappPostMessageTransport')

/**
 * @internalapi
 *
 *
 */
export class DappWalletConnectTransport extends WalletConnectTransport<
  // TODO JGD
  ExtendedWalletConnectPairingResponse,
  StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP
> {
  constructor(name: string, keyPair: KeyPair, storage: Storage) {
    super(name, keyPair, storage, StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP)
  }

  public async startOpenChannelListener(): Promise<void> {
    // return this.client.listenForChannelOpening(
    //   async (peer: ExtendedWalletConnectPairingResponse) => {
    //     await this.addPeer(peer)
    //     this._isConnected = TransportStatus.CONNECTED
    //     if (this.newPeerListener) {
    //       this.newPeerListener(peer)
    //       this.newPeerListener = undefined // TODO: Remove this once we use the id
    //     }
    //   }
    // )
  }

  public async listenForNewPeer(
    _newPeerListener: (peer: ExtendedPostMessagePairingResponse) => void
  ): Promise<void> {
    // logger.log('listenForNewPeer')
    // this.newPeerListener = newPeerListener
  }

  public async stopListeningForNewPeers(): Promise<void> {
    logger.log('stopListeningForNewPeers')
    this.newPeerListener = undefined
  }
}
