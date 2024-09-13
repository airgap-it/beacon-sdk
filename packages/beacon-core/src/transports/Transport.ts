import { Logger } from '../utils/Logger'
import {
  TransportType,
  TransportStatus,
  PeerInfo,
  StorageKey,
  StorageKeyReturnType,
  ConnectionContext
} from '@airgap/beacon-types'
import { PeerManager } from '../managers/PeerManager'
import { ArrayElem } from '../managers/StorageManager'
import { CommunicationClient } from './clients/CommunicationClient'
import { ClientEvents } from './clients/ClientEvents'
import { ExposedPromise } from '@airgap/beacon-utils'

const logger = new Logger('Transport')

/**
 * @internalapi
 *
 *
 */
export abstract class Transport<
  T extends PeerInfo = PeerInfo,
  K extends
    | StorageKey.TRANSPORT_P2P_PEERS_DAPP
    | StorageKey.TRANSPORT_P2P_PEERS_WALLET
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET
    | StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP = any,
  S extends CommunicationClient = any
> {
  /**
   * The type of the transport
   */
  public readonly type: TransportType = TransportType.POST_MESSAGE

  /**
   * The name of the app
   */
  protected readonly name: string

  /**
   * The status of the transport
   */
  protected _isConnected: TransportStatus = TransportStatus.NOT_CONNECTED

  protected readonly peerManager: PeerManager<K>

  /**
   * The client handling the encryption/decryption of messages
   */
  protected client: S

  /**
   * The listener that will be invoked when a new peer is connected
   */
  protected newPeerListener?: (peer: T) => void

  setEventHandler(event: ClientEvents, fun: Function) {
    this.client.eventHandlers.set(event, fun)
  }

  /**
   * The listeners that will be notified when new messages are coming in
   */
  private listeners: ((message: unknown, connectionInfo: ConnectionContext) => void)[] = []

  /**
   * Return the status of the connection
   */
  public get connectionStatus(): TransportStatus {
    return this._isConnected
  }

  private isReady = new ExposedPromise<boolean>()

  constructor(name: string, client: S, peerManager: PeerManager<K>) {
    this.name = name
    this.client = client
    this.peerManager = peerManager
  }

  /**
   * @deprecated use checkIfReady on your transport instance instead.
   * Returns a promise that resolves to true if the transport is available, false if it is not
   */
  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  /**
   * Returns a promise that blocks the execution flow when awaited if the transport hasn't resolved yet; otherwise, it returns true.
   */
  checkIfReady(): Promise<boolean> {
    return this.isReady.promise
  }

  /**
   * Connect the transport
   */
  public async connect(): Promise<void> {
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTED

    this.isReady.resolve(true)

    return
  }

  /**
   * Disconnect the transport
   */
  public async disconnect(): Promise<void> {
    logger.log('disconnect')
    this._isConnected = TransportStatus.NOT_CONNECTED

    this.isReady = new ExposedPromise<boolean>()

    return
  }

  /**
   * Send a message through the transport
   *
   * @param message The message to send
   * @param recipient The recipient of the message
   */
  public async send(message: string, peer?: PeerInfo): Promise<void> {
    if (peer) {
      return this.client.sendMessage(message, peer)
    } else {
      const knownPeers = await this.getPeers()
      // A broadcast request has to be sent everywhere.
      const promises = knownPeers.map((peerEl) => this.client.sendMessage(message, peerEl))

      return (await Promise.all(promises))[0]
    }
  }

  /**
   * Add a listener to be called when a new message is received
   *
   * @param listener The listener that will be registered
   */
  public async addListener(
    listener: (message: unknown, connectionInfo: ConnectionContext) => void
  ): Promise<void> {
    logger.debug('addListener')

    this.listeners.push(listener)

    return
  }

  /**
   * Remove a listener
   *
   * @param listener
   */
  public async removeListener(
    listener: (message: string, connectionInfo: ConnectionContext) => void
  ): Promise<void> {
    logger.log('removeListener')

    this.listeners = this.listeners.filter((element) => element !== listener)

    return
  }

  public async getPeers(): Promise<T[]> {
    return this.peerManager.getPeers() as any // TODO: Fix type
  }

  public async addPeer(newPeer: T, _sendPairingResponse: boolean = true): Promise<void> {
    logger.log('addPeer', 'adding peer', newPeer)
    await this.peerManager.addPeer(newPeer as ArrayElem<StorageKeyReturnType[K]>) // TODO: Fix type
    await this.listen(newPeer.publicKey)
  }

  public async removePeer(peerToBeRemoved: T): Promise<void> {
    logger.log('removePeer', 'removing peer', peerToBeRemoved)
    await this.peerManager.removePeer(peerToBeRemoved.publicKey)
    if (this.client) {
      await this.client.unsubscribeFromEncryptedMessage(peerToBeRemoved.publicKey)
    }
  }

  public async removeAllPeers(): Promise<void> {
    logger.log('removeAllPeers')
    await this.peerManager.removeAllPeers()
    if (this.client) {
      await this.client.unsubscribeFromEncryptedMessages()
    }
  }

  /**
   * Notify the listeners when a new message comes in
   *
   * @param message Message
   * @param connectionInfo Context info about the connection
   */
  protected async notifyListeners(
    message: unknown,
    connectionInfo: ConnectionContext
  ): Promise<void> {
    if (this.listeners.length === 0) {
      logger.warn('notifyListeners', '0 listeners notified!', this)
    } else {
      logger.log('notifyListeners', `Notifying ${this.listeners.length} listeners`, this)
    }

    this.listeners.forEach((listener) => {
      listener(message, connectionInfo)
    })

    return
  }

  abstract listen(publicKey: string): Promise<void>
}
