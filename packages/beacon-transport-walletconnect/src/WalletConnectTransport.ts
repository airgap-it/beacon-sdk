import { KeyPair } from '@stablelib/ed25519'
import { WalletConnectCommunicationClient } from './communication-client/WalletConnectCommunicationClient'
import {
  ConnectionContext,
  Origin,
  Storage,
  TransportStatus,
  ExtendedWalletConnectPairingResponse,
  StorageKey,
  WalletConnectPairingRequest,
  NetworkType,
  TransportType
} from '@airgap/beacon-types'
import { Transport, PeerManager } from '@airgap/beacon-core'
import { SignClientTypes } from '@walletconnect/types'

/**
 * @internalapi
 *
 *
 */

export class WalletConnectTransport<
  T extends WalletConnectPairingRequest | ExtendedWalletConnectPairingResponse,
  K extends StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP
> extends Transport<T, K, WalletConnectCommunicationClient> {
  public readonly type: TransportType = TransportType.WALLETCONNECT

  constructor(
    name: string,
    _keyPair: KeyPair,
    storage: Storage,
    storageKey: K,
    private wcOptions: { network: NetworkType; opts: SignClientTypes.Options }
  ) {
    super(
      name,
      WalletConnectCommunicationClient.getInstance(wcOptions),
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

    await this.client.init()

    const knownPeers = await this.getPeers()

    if (knownPeers.length > 0) {
      knownPeers.map(async (peer) => this.listen(peer.publicKey))
    }

    await this.startOpenChannelListener()

    return super.connect()
  }

  wasDisconnectedByWallet() {
    return !!this.client.disconnectionEvents.size
  }

  public async hasPairings() {
    return (await this.client.storage.hasPairings())
      ? true
      : !!this.client.signClient?.pairing.getAll()?.length
  }

  public async hasSessions() {
    return (await this.client.storage.hasSessions())
      ? true
      : !!this.client.signClient?.session.getAll()?.length
  }

  /**
   * Forcefully updates any DApps running on the same session
   * Typical use case: localStorage changes to reflect to indexDB
   * @param type the message type
   */
  public forceUpdate(type: string) {
    this.client.storage.notify(type)
  }

  public async getPeers(): Promise<T[]> {
    const client = WalletConnectCommunicationClient.getInstance(this.wcOptions)
    const session = client.currentSession()
    if (!session) {
      return []
    }
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
    await this.client.close()

    return super.disconnect()
  }

  public async startOpenChannelListener(): Promise<void> {
    //
  }

  async doClientCleanup() {
    await this.client.unsubscribeFromEncryptedMessages()
  }

  public getPairingRequestInfo(): Promise<any> {
    return this.client.getPairingRequestInfo()
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
