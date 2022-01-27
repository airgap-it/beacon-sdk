import { KeyPair } from 'libsodium-wrappers'
import { StorageKey, Storage, PostMessagePairingRequest } from '@airgap/beacon-types'
import { BridgeTransport } from '@airgap/beacon-transport-bridge'

// const logger = new Logger('WalletPostMessageTransport')

/**
 * @internalapi
 *
 *
 */
export class WalletBridgeTransport extends BridgeTransport<
  PostMessagePairingRequest,
  StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET
> {
  constructor(name: string, keyPair: KeyPair, storage: Storage) {
    super(name, keyPair, storage, StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET)
  }

  public async addPeer(
    newPeer: PostMessagePairingRequest,
    sendPairingResponse: boolean = true
  ): Promise<void> {
    await super.addPeer(newPeer)
    if (sendPairingResponse) {
      await this.client.sendPairingResponse(newPeer) // TODO: Should we have a confirmation here?
    }
  }
}
