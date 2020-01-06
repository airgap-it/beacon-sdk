import { WalletCommunicationClient } from '../..'
import { showAlert } from '../Alert'
import { Storage } from '../storage/Storage'
import { getStorage } from '../storage/getStorage'
import { Transport } from './Transport'

const CommunicationSecretKey = 'communication-secret-key'

export class P2PTransport extends Transport {
  private storage: Storage | undefined
  private client: WalletCommunicationClient | undefined
  private pubKey: string | undefined

  constructor() {
    super()
    getStorage()
      .then(storage => (this.storage = storage))
      .catch(error => console.error(error))
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  public async connect(): Promise<void> {
    return new Promise(async resolve => {
      const key = await this.getOrCreateKey()
      this.client = new WalletCommunicationClient('DAPP', key, 1, false)
      await this.client.start()

      await this.client.listenForChannelOpening(pubKey => {
        this.pubKey = pubKey
        this.listen()
        resolve()
      })

      showAlert({
        title: `Pair Wallet (${key})`,
        html: this.client.getHandshakeQR('svg').replace('width="98px"', 'width="300px"').replace('height="98px"', 'height="300px"'),
        confirmButtonText: 'Done!'
      })
    })
  }

  public async send(message: string): Promise<void> {
    if (!this.client) {
      throw new Error('client not ready')
    }
    if (!this.pubKey) {
      throw new Error('channel not ready')
    }

    return this.client.sendMessage(this.pubKey, message)
  }

  private async getOrCreateKey(): Promise<string> {
    await new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, 100)
    })

    if (!this.storage) {
      throw new Error('no storage')
    }
    const storageValue: unknown = await this.storage.get(CommunicationSecretKey)
    if (storageValue && typeof storageValue === 'string') {
      return storageValue
    } else {
      const key = Math.random().toString()
      await this.storage.set(CommunicationSecretKey, key)

      return key
    }
  }

  private listen(): void {
    if (!this.client) {
      throw new Error('client not ready')
    }
    if (!this.pubKey) {
      throw new Error('channel not ready')
    }
    this.client
      .listenForEncryptedMessage(this.pubKey, message => {
        this.notifyListeners(message).catch(error => {
          throw error
        })
      })
      .catch(error => {
        throw error
      })
  }
}
