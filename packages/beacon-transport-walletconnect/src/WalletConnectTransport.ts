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
import { ExposedPromise } from '@airgap/beacon-utils'

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

  private isReady = new ExposedPromise<boolean>()

  constructor(
    name: string,
    _keyPair: KeyPair,
    storage: Storage,
    storageKey: K,
    private wcOptions: { network: NetworkType; opts: SignClientTypes.Options },
    private isLeader: () => boolean
  ) {
    super(
      name,
      WalletConnectCommunicationClient.getInstance(wcOptions, isLeader),
      new PeerManager<K>(storage, storageKey)
    )
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  /**
   * Returns a promise that blocks the execution flow when awaited if the transport hasn't resolved yet; otherwise, it returns true.
   */
  waitForResolution(): Promise<boolean> {
    return this.isReady.promise
  }

  public async connect(): Promise<void> {
    if ([TransportStatus.CONNECTED, TransportStatus.CONNECTING].includes(this._isConnected)) {
      return
    }

    this._isConnected = TransportStatus.CONNECTING

    const isLeader = await this.isLeader()

    if (isLeader) {
      await this.client.init()
    }

    const knownPeers = await this.getPeers()

    if (knownPeers.length > 0) {
      knownPeers.map(async (peer) => this.listen(peer.publicKey))
    }

    await this.startOpenChannelListener()
    await super.connect()

    if (!isLeader) {
      this._isConnected = TransportStatus.SECONDARY_TAB_CONNECTED
    }

    this.isReady.resolve(true)
  }

  wasDisconnectedByWallet() {
    return !!this.client.disconnectionEvents.size
  }

  closeClient() {
    this.client.closeSignClient()
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

  public async getPeers(): Promise<T[]> {
    const client = WalletConnectCommunicationClient.getInstance(this.wcOptions, this.isLeader)
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

    await super.disconnect()

    this.isReady = new ExposedPromise()
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
