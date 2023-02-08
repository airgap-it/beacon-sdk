import {
  ExtendedWalletConnectPairingResponse,
  PeerManager,
  StorageKey,
  Transport,
  WalletConnectPairingRequest
} from '@airgap/beacon-dapp'
import { KeyPair } from '@stablelib/ed25519'
import { WalletConnectCommunicationClient } from './communication-client/WalletConnectCommunicationClient'
import { ConnectionContext, Origin, Storage, TransportStatus } from '@airgap/beacon-types'

/**
 * @internalapi
 *
 *
 */

export class WalletConnectTransport<
  T extends WalletConnectPairingRequest | ExtendedWalletConnectPairingResponse,
  K extends StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP
> extends Transport<T, K, WalletConnectCommunicationClient> {
  // public readonly type: TransportType = TransportType.WALLETCONNECT

  constructor(name: string, _keyPair: KeyPair, storage: Storage, storageKey: K) {
    super(
      name,
      WalletConnectCommunicationClient.getInstance(),
      new PeerManager<K>(storage, storageKey)
    )
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  public async connect(): Promise<void> {
    if (this._isConnected !== TransportStatus.NOT_CONNECTED) {
      return
    }

    this._isConnected = TransportStatus.CONNECTING

    // await this.client.start()

    const knownPeers = await this.getPeers()

    if (knownPeers.length > 0) {
      knownPeers.map(async (peer) => this.listen(peer.publicKey))
    }

    await this.startOpenChannelListener()

    return super.connect()
  }

  public async getPeers(): Promise<T[]> {
    const client = WalletConnectCommunicationClient.getInstance()
    const session = client.getSession()
    return [
      {
        senderId: session.peer.publicKey,
        extensionId: session.peer.metadata.name,
        id: session.peer.publicKey,
        type: 'walletconnect-pairing-response',
        name: 'peer',
        publicKey: session.peer.publicKey,
        version: 'first'
      } as T
    ]
  }

  public async disconnect(): Promise<void> {
    // await this.client.stop()

    return super.disconnect()
  }

  public async startOpenChannelListener(): Promise<void> {
    //
  }

  public async getPairingRequestInfo(): Promise<any> {
    // return this.client.getPairingRequestInfo()
  }

  public async listen(publicKey: string): Promise<void> {
    await this.client
      .listenForEncryptedMessage(publicKey, (message) => {
        const connectionContext: ConnectionContext = {
          origin: Origin.WALLETCONNECT,
          id: publicKey
        }

        this.notifyListeners(message, connectionContext).catch((error) => {
          throw error
        })
      })
      .catch((error) => {
        throw error
      })
  }
}
