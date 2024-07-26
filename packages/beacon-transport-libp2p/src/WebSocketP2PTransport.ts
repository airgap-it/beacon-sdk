import { PeerManager, Transport } from '@airgap/beacon-core'
import { WebSocketP2PCommunicationClient } from './communication-client/WebSocketP2PCommunicationClient'
import {
  P2PPairingRequest,
  ExtendedP2PPairingResponse,
  Storage,
  StorageKey,
  Origin,
} from '@airgap/beacon-types'
import { KeyPair } from '@acurast/dapp'

const DEFAULT_NODES = [
  'wss://websocket-proxy-1.prod.gke.acurast.com/',
  'wss://websocket-proxy-2.prod.gke.acurast.com/'
]

export class WebSocketP2PTransport<
  T extends P2PPairingRequest | ExtendedP2PPairingResponse,
  K extends StorageKey.TRANSPORT_P2P_PEERS_DAPP | StorageKey.TRANSPORT_P2P_PEERS_WALLET
> extends Transport<T, K, WebSocketP2PCommunicationClient> {
  constructor(
    name: string,
    keyPair: KeyPair,
    storage: Storage,
    storageKey: K,
    urls: string[] = DEFAULT_NODES
  ) {
    super(
      name,
      new WebSocketP2PCommunicationClient(urls, keyPair),
      new PeerManager(storage, storageKey)
    )
  }

  async connect() {
    await this.client.connect()
    super.connect()
  }

  async disconnect(): Promise<void> {
    await this.client.close()
  }

  async listen(publicKey: string): Promise<void> {
    this.client.listenForEncryptedMessage(publicKey, (message) =>
      this.notifyListeners(message, {
        origin: Origin.P2P,
        id: publicKey
      })
    )
  }
}
