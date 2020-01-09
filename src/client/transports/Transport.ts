import { Logger } from "../utils/Logger"

export enum TransportStatus {
  NOT_CONNECTED = 'NOT_CONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED'
}

export enum TransportType {
  CHROME_MESSAGE = 'chrome_message',
  POST_MESSAGE = 'post_message',
  DEEPLINK = 'deeplink',
  LEDGER = 'ledger',
  P2P = 'p2p',
  MEMORY = 'in_memory'
}

const logger = new Logger('Transport')

export class Transport {
  public readonly type: TransportType = TransportType.MEMORY

  protected _isConnected: TransportStatus = TransportStatus.NOT_CONNECTED
  public get connectionStatus(): TransportStatus {
    return this._isConnected
  }

  private listeners: ((message: string) => void)[] = []

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  public async connect(): Promise<void> {
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTED

    return
  }

  public async send(message: string): Promise<void> {
    logger.log('send', message)

    await this.notifyListeners(message)

    return
  }

  public async addListener(listener: (message: string) => void): Promise<void> {
    logger.log('addListener')

    this.listeners.push(listener)

    return
  }

  public async removeListener(listener: (message: string) => void): Promise<void> {
    logger.log('removeListener')

    this.listeners = this.listeners.filter(element => element !== listener)

    return
  }

  protected async notifyListeners(message: string): Promise<void> {
    logger.log('notifyListeners')

    if (this.listeners.length === 0) {
      logger.warn('notifyListeners', '0 listeners notified!', this)
    } else {
      logger.log(`Notifying ${this.listeners.length} listeners`, this)
    }

    this.listeners.forEach(listener => {
      listener(message)
    })

    return
  }
}
