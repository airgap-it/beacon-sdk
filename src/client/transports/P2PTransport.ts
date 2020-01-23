import { WalletCommunicationClient } from '../..'
import { openAlert, closeAlert, AlertConfig } from '../alert/Alert'
import { Storage, StorageKey } from '../storage/Storage'
import { generateGUID } from '../utils/generate-uuid'
import { Logger } from '../utils/Logger'
import { TransportStatus, Transport, TransportType } from './Transport'

const logger = new Logger('Transport')

export class P2PTransport extends Transport {
  public readonly type: TransportType = TransportType.P2P

  private readonly isDapp: boolean = true
  private readonly storage: Storage
  private client: WalletCommunicationClient | undefined

  constructor(name: string, storage: Storage, isDapp: boolean) {
    super(name)
    this.storage = storage
    this.isDapp = isDapp
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  public async connect(): Promise<void> {
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTING

    const key = await this.getOrCreateKey()

    this.client = new WalletCommunicationClient(this.name, key, 1, false)
    await this.client.start()

    const knownPeers = await this.storage.get(StorageKey.TRANSPORT_P2P_PEERS)

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async peer => this.listen(peer.pubKey))
      await Promise.all(connectionPromises)
    } else {
      if (this.isDapp) {
        return this.connectNewPeer()
      }
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

        const knownPeers = await this.storage.get(StorageKey.TRANSPORT_P2P_PEERS)
        if (!knownPeers.some(peer => peer.pubKey === pubKey)) {
          knownPeers.push({ name: '', pubKey, relayServer: '' })
          this.storage
            .set(StorageKey.TRANSPORT_P2P_PEERS, knownPeers)
            .catch(storageError => logger.error(storageError))
          await this.listen(pubKey)
        }

        closeAlert()
        openAlert({
          title: 'Success',
          confirmButtonText: 'Ok!',
          timer: 1500
        })

        resolve()
      })

      const alertConfig: AlertConfig = {
        title: 'Pairing Request',
        confirmButtonText: 'Ok!',
        body: [
          this.client.getHandshakeQR('svg')
        ].join(''),
        successCallback: () => {
          console.log('CALLBACK')
        }
      }
      openAlert(alertConfig)
    })
  }

  public async getPeers(): Promise<any[]> {
    logger.log('getPeers')
    const peers = await this.storage.get(StorageKey.TRANSPORT_P2P_PEERS)
    logger.log('getPeers', `${peers.length} connected`)

    return peers
  }

  public async addPeer(newPeer: any): Promise<void> {
    logger.log('addPeer', newPeer)
    const peers = await this.storage.get(StorageKey.TRANSPORT_P2P_PEERS)
    if (!peers.some(peer => peer.pubKey === newPeer.pubKey)) {
      peers.push({
        name: newPeer.name,
        pubKey: newPeer.pubKey,
        relayServer: newPeer.relayServer
      })
      await this.storage.set(StorageKey.TRANSPORT_P2P_PEERS, peers)
      logger.log('addPeer', `peer added, now ${peers.length} peers`)
    }

    if (!this.client) {
      throw new Error('client not ready')
    }

    await this.client.openChannel(newPeer.pubKey, newPeer.relayServer) // TODO: Should we have a confirmation here?
    await this.listen(newPeer.pubKey) // TODO: Prevent channels from being opened multiple times
  }

  public async removePeer(peerToBeRemoved: any): Promise<void> {
    logger.log('removePeer', peerToBeRemoved)
    let peers = await this.storage.get(StorageKey.TRANSPORT_P2P_PEERS)
    peers = peers.filter(peer => peer.pubKey !== peerToBeRemoved.pubKey)
    await this.storage.set(StorageKey.TRANSPORT_P2P_PEERS, peers)
    if (this.client) {
      await this.client.unsubscribeFromEncryptedMessage(peerToBeRemoved.pubKey)
    }
    logger.log('removePeer', `${peers.length} peers left`)
  }

  public async removeAllPeers(): Promise<void> {
    logger.log('removeAllPeers')
    await this.storage.set(StorageKey.TRANSPORT_P2P_PEERS, [])

    if (this.client) {
      await this.client.unsubscribeFromEncryptedMessages()
    }
  }

  public async send(message: string): Promise<void> {
    const knownPeers = await this.storage.get(StorageKey.TRANSPORT_P2P_PEERS)

    const promises = knownPeers.map(peer => {
      if (!this.client) {
        throw new Error('client not ready')
      }

      return this.client.sendMessage(peer.pubKey, message)
    })

    return (await Promise.all(promises))[0]
  }

  private async getOrCreateKey(): Promise<string> {
    if (!this.storage) {
      throw new Error('no storage')
    }
    const storageValue: unknown = await this.storage.get(StorageKey.TRANSPORT_P2P_SECRET_KEY)
    if (storageValue && typeof storageValue === 'string') {
      return storageValue
    } else {
      const key = generateGUID()
      await this.storage.set(StorageKey.TRANSPORT_P2P_SECRET_KEY, key)

      return key
    }
  }

  private async listen(pubKey: string): Promise<void> {
    if (!this.client) {
      throw new Error('client not ready')
    }
    await this.client
      .listenForEncryptedMessage(pubKey, message => {
        this.notifyListeners(message, { pubKey }).catch(error => {
          throw error
        })
      })
      .catch(error => {
        throw error
      })
  }
}
