import {
  StorageKey,
  Storage,
  ExtendedWalletConnectPairingResponse,
  NetworkType
} from '@airgap/beacon-types'
import { Logger } from '@airgap/beacon-core'
import { WalletConnectTransport } from '@airgap/beacon-transport-walletconnect'
import { KeyPair } from '@stablelib/ed25519'
import { SignClientTypes } from '@walletconnect/types'

const logger = new Logger('DappWalletConnectTransport')

/**
 * @internalapi
 *
 *
 */
export class DappWalletConnectTransport extends WalletConnectTransport<
  ExtendedWalletConnectPairingResponse,
  StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP
> {
  constructor(
    name: string,
    keyPair: KeyPair,
    storage: Storage,
    wcOptions: { network: NetworkType; opts: SignClientTypes.Options },
    isLeader: () => Promise<boolean>
  ) {
    super(
      name,
      keyPair,
      storage,
      StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP,
      wcOptions,
      isLeader
    )
    this.client.listenForChannelOpening(async (peer: ExtendedWalletConnectPairingResponse) => {
      await this.addPeer(peer)
      this.updatePeerListener(peer)
    })
  }

  public async listenForNewPeer(
    newPeerListener: (peer: ExtendedWalletConnectPairingResponse) => void
  ): Promise<void> {
    // logger.log('listenForNewPeer')
    this.newPeerListener = newPeerListener
  }

  public async stopListeningForNewPeers(): Promise<void> {
    logger.log('stopListeningForNewPeers')
    this.newPeerListener = undefined
  }

  updatePeerListener(peer: ExtendedWalletConnectPairingResponse) {
    if (this.newPeerListener) {
      this.newPeerListener(peer)
      this.newPeerListener = undefined // TODO: Remove this once we use the id
    }
  }
}
