import { ExtendedP2PPairingResponse, Storage, StorageKey } from '@airgap/beacon-types'
import { WebSocketP2PTransport } from '@airgap/beacon-transport-libp2p'
import { KeyPair } from '@stablelib/ed25519'

export class DappLibP2PTransport extends WebSocketP2PTransport<
  ExtendedP2PPairingResponse,
  StorageKey.TRANSPORT_LIBP2P_PEERS_DAPP
> {
  constructor(name: string, keyPair: KeyPair, storage: Storage, urls?: string[]) {
    super(name, keyPair, storage, StorageKey.TRANSPORT_LIBP2P_PEERS_DAPP, urls)
  }
}
