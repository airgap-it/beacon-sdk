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
import { Transport, PeerManager, BEACON_VERSION } from '@airgap/beacon-core'
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

  protected isReady = new ExposedPromise<boolean>()

  constructor(
    name: string,
    _keyPair: KeyPair,
    storage: Storage,
    storageKey: K,
    private wcOptions: { network: NetworkType; opts: SignClientTypes.Options },
    private isLeader: Function
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

  /**
   * Forcefully updates any DApps running on the same session
   * Typical use case: localStorage changes to reflect to indexDB
   * @param type the message type
   */
  public forceUpdate(type: string) {
    this.client.storage.notify(type)
  }

  public async getPeers(): Promise<T[]> {
    const client = WalletConnectCommunicationClient.getInstance(this.wcOptions, this.isLeader)
    const session = client.currentSession()
    if (!session) {
      return []
    }
    const metadata = session.peer.metadata as Record<string, any>
    const rawProtocolVersion = metadata?.protocolVersion ?? metadata?.extensions?.protocolVersion
    const protocolVersion = Number(rawProtocolVersion)
    const resolvedProtocolVersion = Number.isFinite(protocolVersion) ? protocolVersion : undefined

    const basePeer: any = {
      senderId: session.peer.publicKey,
      extensionId: session.peer.metadata.name,
      id: session.peer.publicKey,
      type: 'walletconnect-pairing-response',
      name: session.peer.metadata.name,
      publicKey: session.peer.publicKey,
      version: BEACON_VERSION
    }

    if (resolvedProtocolVersion !== undefined) {
      basePeer.protocolVersion = resolvedProtocolVersion
    }

    return [basePeer as T]
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
    const peer = await this.peerManager.getPeer(publicKey)
    await this.client
      .listenForEncryptedMessage(publicKey, (message) => {
        const connectionContext: ConnectionContext = {
          origin: Origin.WALLETCONNECT,
          id: publicKey
        }

        this.notifyListeners(message, connectionContext).catch((error) => {
          throw error
        })
      }, peer?.protocolVersion)
      .catch((error) => {
        throw error
      })
  }
}
