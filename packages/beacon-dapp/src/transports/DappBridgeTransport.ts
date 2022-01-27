import { KeyPair } from 'libsodium-wrappers'
import {
  TransportStatus,
  StorageKey,
  Storage,
  ExtendedPostMessagePairingResponse
} from '@airgap/beacon-types'
import { Logger } from '@airgap/beacon-core'
import { BridgeTransport } from '@airgap/beacon-transport-bridge'

const logger = new Logger('DappBridgeTransport')

/**
 * @internalapi
 *
 *
 */
export class DappBridgeTransport extends BridgeTransport<
  ExtendedPostMessagePairingResponse,
  StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP
> {
  constructor(name: string, keyPair: KeyPair, storage: Storage) {
    super(name, keyPair, storage, StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP)
  }

  public async startOpenChannelListener(): Promise<void> {
    return this.client.listenForChannelOpening(async (peer: ExtendedPostMessagePairingResponse) => {
      logger.log('connect', `received BridgePairingResponse`, peer)

      await this.addPeer(peer)

      this._isConnected = TransportStatus.CONNECTED

      if (this.newPeerListener) {
        this.newPeerListener(peer)
        this.newPeerListener = undefined // TODO: Remove this once we use the id
      }
    })
  }

  public async listenForNewPeer(
    newPeerListener: (peer: ExtendedPostMessagePairingResponse) => void
  ): Promise<void> {
    logger.log('listenForNewPeer')
    this.newPeerListener = newPeerListener
  }

  public async stopListeningForNewPeers(): Promise<void> {
    logger.log('stopListeningForNewPeers')
    this.newPeerListener = undefined
  }
}
