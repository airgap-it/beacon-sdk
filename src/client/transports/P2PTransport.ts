import { WalletCommunicationClient } from '../..'
import { showAlert } from '../Alert'
import { Storage, StorageKey } from '../storage/Storage'
import { generateGUID } from '../utils/generate-uuid'
import { TransportStatus, Transport, TransportType } from './Transport'

export class P2PTransport extends Transport {
  public readonly type: TransportType = TransportType.P2P

  private readonly storage: Storage
  private client: WalletCommunicationClient | undefined

  constructor(storage: Storage) {
    super()
    this.storage = storage
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  public async connect(): Promise<void> {
    this._isConnected = TransportStatus.CONNECTING
    
    const key = await this.getOrCreateKey()

    this.client = new WalletCommunicationClient('DAPP', key, 1, false)
    await this.client.start()

    const knownPeers = await this.storage.get(StorageKey.COMMUNICATION_PEERS)

    if (knownPeers.length > 0) {
      knownPeers.forEach(peer => {
        this.listen(peer)
      })
    } else {
      return this.connectNewPeer()
    }

    await super.connect()
  }

  public async connectNewPeer(): Promise<void> {
    return new Promise(async resolve => {
      if (!this.client) {
        throw new Error('client not ready')
      }

      await this.client.listenForChannelOpening(async pubKey => {
        const knownPeers = await this.storage.get(StorageKey.COMMUNICATION_PEERS)
        if (!knownPeers.some(peer => peer === pubKey)) {
          knownPeers.push(pubKey)
          this.storage.set(StorageKey.COMMUNICATION_PEERS, knownPeers).catch(storageError => console.error(storageError))
          this.listen(pubKey)
        }

        resolve()
      })

      showAlert({
        title: `Pair Wallet`,
        html: [
          this.client.getHandshakeQR('svg').replace('width="98px"', 'width="300px"').replace('height="98px"', 'height="300px"'),
          '<br />',
          this.client.getHandshakeInfo()
        ].join(''),
        confirmButtonText: 'Done!'
      })
    })
  }

  public async send(message: string): Promise<void> {
    const knownPeers = await this.storage.get(StorageKey.COMMUNICATION_PEERS)

    const promises = knownPeers.map(peer => {
      if (!this.client) {
        throw new Error('client not ready')
      }

      return this.client.sendMessage(peer, message)
    })

    return Promise.all(promises)[0]
  }

  private async getOrCreateKey(): Promise<string> {
    if (!this.storage) {
      throw new Error('no storage')
    }
    const storageValue: unknown = await this.storage.get(StorageKey.COMMUNICATION_SECRET_KEY)
    if (storageValue && typeof storageValue === 'string') {
      return storageValue
    } else {
      const key = generateGUID()
      await this.storage.set(StorageKey.COMMUNICATION_SECRET_KEY, key)

      return key
    }
  }

  private listen(pubKey: string): void {
    if (!this.client) {
      throw new Error('client not ready')
    }
    this.client
      .listenForEncryptedMessage(pubKey, message => {
        this.notifyListeners(message).catch(error => {
          throw error
        })
      })
      .catch(error => {
        throw error
      })
  }
}
