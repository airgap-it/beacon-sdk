import { PeerManager, Transport } from '@airgap/beacon-core'
import { WebSocketP2PCommunicationClient } from './communication-client/WebSocketP2PCommunicationClient'
import {
  P2PPairingRequest,
  ExtendedP2PPairingResponse,
  Storage,
  StorageKey,
  Origin,
  TransportType
} from '@airgap/beacon-types'
import { KeyPair } from '@stablelib/ed25519'

const DEFAULT_NODES = ['ws://localhost:9001/', 'ws://localhost:9002/']

export class WebSocketP2PTransport<
  T extends P2PPairingRequest | ExtendedP2PPairingResponse,
  K extends StorageKey.TRANSPORT_LIBP2P_PEERS_DAPP | StorageKey.TRANSPORT_LIBP2P_PEERS_WALLET
> extends Transport<T, K, WebSocketP2PCommunicationClient> {
  public readonly type: TransportType = TransportType.LIBP2P
  constructor(
    name: string,
    keyPair: KeyPair,
    pkHash: string,
    storage: Storage,
    storageKey: K,
    urls: string[] = DEFAULT_NODES
  ) {
    super(
      name,
      new WebSocketP2PCommunicationClient(name, urls, keyPair, pkHash),
      new PeerManager(storage, storageKey)
    )
  }

  async connect() {
    await this.client.connect()
    return super.connect()
  }

  async disconnect(): Promise<void> {
    await this.client.close()
    return super.disconnect()
  }

  public getPairingRequestInfo(): Promise<P2PPairingRequest> {
    return this.client.getPairingRequestInfo()
  }

  async listen(publicKey: string): Promise<void> {
    this.client.listenForEncryptedMessage(publicKey, (message) =>
      this.notifyListeners(message, {
        origin: Origin.LIBP2P,
        id: publicKey
      })
    )
  }
}
