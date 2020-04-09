import { BaseMessage, Network, PermissionScope } from '../types/Messages'
import { Serializer } from '../Serializer'
import { ExposedPromise, exposedPromise } from '../utils/exposed-promise'
import { PostMessageTransport } from '../transports/PostMessageTransport'
import { P2PTransport } from '../transports/P2PTransport'
import { Transport, TransportType, TransportStatus } from '../transports/Transport'
// Import { Logger } from '../utils/Logger'
import { getStorage } from '../storage/getStorage'
import { Storage, StorageKey } from '../storage/Storage'
import { generateGUID } from '../utils/generate-uuid'

// Const logger = new Logger('BaseClient')

export type AccountIdentifier = string

export interface AccountInfo {
  accountIdentifier: AccountIdentifier
  senderId: string
  pubkey: string
  network: Network
  scopes: PermissionScope[]
  firstConnected: Date
}

export class BaseClient {
  protected requestCounter: number[] = []
  protected readonly rateLimit: number = 2
  protected readonly rateLimitWindowInSeconds: number = 5
  protected beaconId: string | undefined
  protected readonly name: string
  protected readonly serializer = new Serializer()

  protected handleResponse: (_event: BaseMessage, connectionInfo: any) => void

  protected storage: Storage | undefined
  protected transport: Transport | undefined

  protected readonly _isConnected: ExposedPromise<boolean> = exposedPromise()

  constructor(name: string) {
    this.name = name
    this.handleResponse = (_event: BaseMessage) => {
      throw new Error('not overwritten')
    }
  }

  public async addRequestAndCheckIfRateLimited(): Promise<boolean> {
    const now: number = new Date().getTime()
    this.requestCounter = this.requestCounter.filter(
      date => date + this.rateLimitWindowInSeconds * 1000 > now
    )

    this.requestCounter.push(now)

    return this.requestCounter.length > this.rateLimit
  }

  public async init(isDapp: boolean = true, transport?: Transport): Promise<TransportType> {
    if (this.transport) {
      return this.transport.type
    }

    if (!this.storage) {
      this.storage = await getStorage()
    }

    this.beaconId = await this.getOrCreateBeaconId()

    if (transport) {
      this.transport = transport // Let users define their own transport
    } else if (await PostMessageTransport.isAvailable()) {
      this.transport = new PostMessageTransport(name) // Talk to extension first and relay everything
    } else if (await P2PTransport.isAvailable()) {
      this.transport = new P2PTransport(this.name, this.storage, isDapp) // Establish our own connection with the wallet
    } else {
      throw new Error('no transport available for this platform!')
    }

    return this.transport.type
  }

  public get isConnected(): Promise<boolean> {
    return this._isConnected.promise
  }

  public async getPeers(): Promise<string[]> {
    if (!this.transport) {
      throw new Error('no transport defined')
    }

    return this.transport.getPeers()
  }

  public async addPeer(id: string): Promise<void> {
    if (!this.transport) {
      throw new Error('no transport defined')
    }

    return this.transport.addPeer(id)
  }

  public async removePeer(id: string): Promise<void> {
    if (!this.transport) {
      throw new Error('no transport defined')
    }

    return this.transport.removePeer(id)
  }

  public async removeAllPeers(): Promise<void> {
    if (!this.transport) {
      throw new Error('no transport defined')
    }

    return this.transport.removeAllPeers()
  }

  public async getAccounts(): Promise<AccountInfo[]> {
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    return this.storage.get(StorageKey.ACCOUNTS)
  }

  public async getAccount(accountIdentifier: string): Promise<AccountInfo | undefined> {
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    return accounts.find(account => account.accountIdentifier === accountIdentifier)
  }

  public async addAccount(accountInfo: AccountInfo): Promise<void> {
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    if (!accounts.some(element => element.accountIdentifier === accountInfo.accountIdentifier)) {
      accounts.push(accountInfo)
    }

    return this.storage.set(StorageKey.ACCOUNTS, accounts)
  }

  public async removeAccount(accountIdentifier: string): Promise<void> {
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    const filteredAccounts = accounts.filter(
      accountInfo => accountInfo.accountIdentifier !== accountIdentifier
    )

    return this.storage.set(StorageKey.ACCOUNTS, filteredAccounts)
  }

  public async removeAllAccounts(): Promise<void> {
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    return this.storage.delete(StorageKey.ACCOUNTS)
  }

  protected async _connect(): Promise<boolean> {
    if (this.transport && this.transport.connectionStatus === TransportStatus.NOT_CONNECTED) {
      await this.transport.connect()
      this.transport
        .addListener((message: unknown, connectionInfo: any) => {
          if (typeof message === 'string') {
            const deserializedMessage = this.serializer.deserialize(message) as BaseMessage // TODO: Check type
            this.handleResponse(deserializedMessage, connectionInfo)
          }
        })
        .catch(error => console.log(error))
      this._isConnected.resolve(true)
    } else {
      this._isConnected.reject('no transport available')
    }

    return this._isConnected.promise
  }

  protected async getAccountIdentifier(pubkey: string, network: Network): Promise<string> {
    return `${pubkey}-${network.type}-${network.name}`
  }

  private async getOrCreateBeaconId(): Promise<string> {
    if (!this.storage) {
      throw new Error('no storage')
    }
    const storageValue: unknown = await this.storage.get(StorageKey.BEACON_SDK_ID)
    if (storageValue && typeof storageValue === 'string') {
      return storageValue
    } else {
      const key = generateGUID()
      await this.storage.set(StorageKey.BEACON_SDK_ID, key)

      return key
    }
  }
}
