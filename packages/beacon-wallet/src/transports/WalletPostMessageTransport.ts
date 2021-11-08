import sodium from 'libsodium-wrappers'
import { StorageKey, Storage, PostMessagePairingRequest } from '@airgap/beacon-types'
import { PostMessageTransport } from '@airgap/beacon-transport-postmessage'

// const logger = new Logger('WalletPostMessageTransport')

/**
 * @internalapi
 *
 *
 */
export class WalletPostMessageTransport extends PostMessageTransport<
  PostMessagePairingRequest,
  StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET
> {
  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage) {
    super(name, keyPair, storage, StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET)
  }
}
