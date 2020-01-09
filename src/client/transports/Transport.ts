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
    this._isConnected = TransportStatus.CONNECTED

    return
  }

  public async send(message: string): Promise<void> {
    console.log('MESSAGE SENT: ', message)

    await this.notifyListeners(message)

    return
  }

  public async addListener(listener: (message: string) => void): Promise<void> {
    this.listeners.push(listener)

    return
  }

  public async removeListener(listener: (message: string) => void): Promise<void> {
    this.listeners = this.listeners.filter(element => element !== listener)

    return
  }

  protected async notifyListeners(message: string): Promise<void> {
    if (this.listeners.length === 0) {
      console.warn('0 listeners notified!', this)
    } else {
      console.log(`Notifying ${this.listeners.length} listeners`, this)
    }

    this.listeners.forEach(listener => {
      listener(message)
    })

    return
  }
}
