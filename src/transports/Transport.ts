import { Logger } from '../utils/Logger'
import { ConnectionContext } from '../types/ConnectionContext'
import { TransportType, TransportStatus, PeerInfo } from '..'

const logger = new Logger('Transport')

export abstract class Transport<T extends PeerInfo = any> {
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

  /**
   * The listener that will be invoked when a new peer is connected
   */
  protected newPeerListener?: (peer: T) => void

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

  constructor(name: string) {
    this.name = name
  }

  /**
   * Returns a promise that resolves to true if the transport is available, false if it is not
   */
  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  /**
   * Connect the transport
   */
  public async connect(): Promise<void> {
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTED

    return
  }

  /**
   * Reconnect the transport
   *
   * This method will be called if we tried to connect, but it didn't work
   */
  public async reconnect(): Promise<void> {
    logger.log('reconnect')

    return
  }

  /**
   * Send a message through the transport
   *
   * @param message The message to send
   * @param recipient The recipient of the message
   */
  public async send(message: string, recipient?: string): Promise<void> {
    logger.log('send', message, recipient)

    return
  }

  /**
   * Add a listener to be called when a new message is received
   *
   * @param listener The listener that will be registered
   */
  public async addListener(
    listener: (message: unknown, connectionInfo: ConnectionContext) => void
  ): Promise<void> {
    logger.log('addListener')

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

  public async listenForNewPeer(newPeerListener: (peer: T) => void): Promise<void> {
    logger.log('listenForNewPeer')
    this.newPeerListener = newPeerListener
  }

  public async stopListeningForNewPeers(): Promise<void> {
    logger.log('stopListeningForNewPeers')
    this.newPeerListener = undefined
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
    logger.log('notifyListeners')

    if (this.listeners.length === 0) {
      logger.warn('notifyListeners', '0 listeners notified!', this)
    } else {
      logger.log(`Notifying ${this.listeners.length} listeners`, this)
    }

    this.listeners.forEach((listener) => {
      listener(message, connectionInfo)
    })

    return
  }
}
