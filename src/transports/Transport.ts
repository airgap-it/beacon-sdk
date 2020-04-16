import { Logger } from '../utils/Logger'

export enum TransportStatus {
  NOT_CONNECTED = 'NOT_CONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED'
}

export enum TransportType {
  CHROME_MESSAGE = 'chrome_message',
  POST_MESSAGE = 'post_message',
  LEDGER = 'ledger',
  P2P = 'p2p'
}

const logger = new Logger('Transport')

export abstract class Transport {
  public readonly type: TransportType = TransportType.POST_MESSAGE

  protected readonly name: string
  protected _isConnected: TransportStatus = TransportStatus.NOT_CONNECTED

  private listeners: ((message: unknown, connectionInfo: any) => void)[] = []
  private peers: string[] = []

  public get connectionStatus(): TransportStatus {
    return this._isConnected
  }

  constructor(name: string) {
    this.name = name
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  public async getPeers(): Promise<string[]> {
    logger.log('getPeers', `${this.peers.length}`)

    return this.peers
  }

  public async addPeer(id: string): Promise<void> {
    logger.log('addPeer', id)
    this.peers = [...this.peers.filter(peer => peer !== id), id]
    logger.log('addPeer', `${this.peers.length} peers`)
  }

  public async removePeer(id: string): Promise<void> {
    logger.log('removePeer', id)
    this.peers = this.peers.filter(peer => peer !== id)
    logger.log('removePeer', `${this.peers.length} peers left`)
  }

  public async removeAllPeers(): Promise<void> {
    logger.log('removeAllPeers', `removing ${this.peers.length} peers`)
    this.peers = []
  }

  public async connect(): Promise<void> {
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTED

    return
  }

  public async send(message: string, connectionInfo: any): Promise<void> {
    logger.log('send', message, connectionInfo)

    await this.notifyListeners(message, connectionInfo)

    return
  }

  public async addListener(
    listener: (message: unknown, connectionInfo: any) => void
  ): Promise<void> {
    logger.log('addListener')

    this.listeners.push(listener)

    return
  }

  public async removeListener(
    listener: (message: string, connectionInfo: any) => void
  ): Promise<void> {
    logger.log('removeListener')

    this.listeners = this.listeners.filter(element => element !== listener)

    return
  }

  protected async notifyListeners(message: unknown, connectionInfo: any): Promise<void> {
    logger.log('notifyListeners')

    if (this.listeners.length === 0) {
      logger.warn('notifyListeners', '0 listeners notified!', this)
    } else {
      logger.log(`Notifying ${this.listeners.length} listeners`, this)
    }

    this.listeners.forEach(listener => {
      listener(message, connectionInfo)
    })

    return
  }
}
