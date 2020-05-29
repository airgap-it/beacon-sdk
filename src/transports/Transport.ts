import { Logger } from '../utils/Logger'
import { ConnectionContext } from '../types/ConnectionContext'
import { TransportType, TransportStatus } from '..'

const logger = new Logger('Transport')

export abstract class Transport {
  public readonly type: TransportType = TransportType.POST_MESSAGE

  protected readonly name: string
  protected _isConnected: TransportStatus = TransportStatus.NOT_CONNECTED

  private listeners: ((message: unknown, connectionInfo: ConnectionContext) => void)[] = []

  public get connectionStatus(): TransportStatus {
    return this._isConnected
  }

  constructor(name: string) {
    this.name = name
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  public async connect(): Promise<void> {
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTED

    return
  }

  public async reconnect(): Promise<void> {
    logger.log('reconnect')

    return
  }

  public async send(message: string, recipient?: string): Promise<void> {
    logger.log('send', message, recipient)

    return
  }

  public async addListener(
    listener: (message: unknown, connectionInfo: ConnectionContext) => void
  ): Promise<void> {
    logger.log('addListener')

    this.listeners.push(listener)

    return
  }

  public async removeListener(
    listener: (message: string, connectionInfo: ConnectionContext) => void
  ): Promise<void> {
    logger.log('removeListener')

    this.listeners = this.listeners.filter((element) => element !== listener)

    return
  }

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
