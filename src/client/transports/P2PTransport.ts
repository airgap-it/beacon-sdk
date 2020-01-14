import Swal from 'sweetalert2'
import { WalletCommunicationClient } from '../..'
import { showAlert } from '../Alert'
import { Storage, StorageKey } from '../storage/Storage'
import { generateGUID } from '../utils/generate-uuid'
import { Logger } from '../utils/Logger'
import { TransportStatus, Transport, TransportType } from './Transport'

const logger = new Logger('Transport')

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
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTING

    const key = await this.getOrCreateKey()

    this.client = new WalletCommunicationClient('DAPP', key, 1, false)
    await this.client.start()

    const knownPeers = await this.storage.get(StorageKey.COMMUNICATION_PEERS)

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async peer => this.listen(peer))
      await Promise.all(connectionPromises)
    } else {
      return this.connectNewPeer()
    }

    await super.connect()
  }

  public async connectNewPeer(): Promise<void> {
    logger.log('connectNewPeer')

    return new Promise(async resolve => {
      if (!this.client) {
        throw new Error('client not ready')
      }

      await this.client.listenForChannelOpening(async pubKey => {
        logger.log('connectNewPeer', `new pubkey ${pubKey}`)

        const knownPeers = await this.storage.get(StorageKey.COMMUNICATION_PEERS)
        if (!knownPeers.some(peer => peer === pubKey)) {
          knownPeers.push(pubKey)
          this.storage
            .set(StorageKey.COMMUNICATION_PEERS, knownPeers)
            .catch(storageError => console.error(storageError))
          await this.listen(pubKey)
        }

        Swal.close()

        showAlert({
          title: `Pair Wallet`,
          icon: `success`,
          confirmButtonText: 'Done!',
          timer: 1500
        })

        resolve()
      })

      showAlert({
        title: `Pair Wallet`,
        html: [
          this.client
            .getHandshakeQR('svg')
            .replace('width="98px"', 'width="300px"')
            .replace('height="98px"', 'height="300px"'),
          '<br />',
          JSON.stringify(this.client.getHandshakeInfo())
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

    return (await Promise.all(promises))[0]
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

  private async listen(pubKey: string): Promise<void> {
    if (!this.client) {
      throw new Error('client not ready')
    }
    await this.client
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
