import * as sodium from 'libsodium-wrappers'
import { ExposedPromise, exposedPromise } from '../../utils/exposed-promise'
// import { Logger } from '../utils/Logger'
import { generateGUID } from '../../utils/generate-uuid'
import { getKeypairFromSeed, toHex } from '../../utils/crypto'
import { ConnectionContext } from '../../types/ConnectionContext'
import {
  Serializer,
  PostMessageTransport,
  P2PTransport,
  Transport,
  TransportType,
  TransportStatus,
  Storage,
  StorageKey,
  AccountInfo,
  BeaconBaseMessage,
  Network,
  BeaconMessage
} from '../..'
import { BeaconEventHandler } from '../../events'
import { Logger } from '../../utils/Logger'
import { ClientOptions } from './ClientOptions'

const logger = new Logger('BaseClient')

export abstract class Client {
  protected readonly events: BeaconEventHandler = new BeaconEventHandler()

  protected requestCounter: number[] = []
  protected readonly rateLimit: number = 2
  protected readonly rateLimitWindowInSeconds: number = 5
  protected beaconId: string | undefined
  protected readonly name: string

  protected handleResponse: (_event: BeaconMessage, connectionInfo: ConnectionContext) => void

  protected _keyPair: ExposedPromise<sodium.KeyPair> = exposedPromise()
  protected get keyPair(): Promise<sodium.KeyPair> {
    return this._keyPair.promise
  }

  protected storage: Storage
  protected transport: Transport | undefined

  protected readonly _isConnected: ExposedPromise<boolean> = exposedPromise()

  constructor(config: ClientOptions) {
    this.name = config.name
    this.storage = config.storage

    if (config.eventHandlers) {
      this.events.overrideDefaults(config.eventHandlers).catch((overrideError: Error) => {
        logger.error('constructor', overrideError)
      })
    }

    this.handleResponse = (_event: BeaconBaseMessage, _connectionInfo: ConnectionContext) => {
      throw new Error('not overwritten')
    }
    this.loadOrCreateBeaconSecret().catch(console.error)
    this.keyPair
      .then((keyPair) => {
        this.beaconId = toHex(keyPair.publicKey)
      })
      .catch(console.error)
  }

  public static async getAccountIdentifier(pubkey: string, network: Network): Promise<string> {
    return `${pubkey}-${network.type}-${network.name}`
  }

  public async addRequestAndCheckIfRateLimited(): Promise<boolean> {
    const now: number = new Date().getTime()
    this.requestCounter = this.requestCounter.filter(
      (date) => date + this.rateLimitWindowInSeconds * 1000 > now
    )

    this.requestCounter.push(now)

    return this.requestCounter.length > this.rateLimit
  }

  public async init(isDapp: boolean = true, transport?: Transport): Promise<TransportType> {
    if (this.transport) {
      return this.transport.type
    }

    if (transport) {
      this.transport = transport // Let users define their own transport
    } else if (await PostMessageTransport.isAvailable()) {
      this.transport = new PostMessageTransport(name) // Talk to extension first and relay everything
    } else if (await P2PTransport.isAvailable()) {
      this.transport = new P2PTransport(
        this.name,
        await this.keyPair,
        this.storage,
        this.events,
        isDapp
      ) // Establish our own connection with the wallet
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
    return this.storage.get(StorageKey.ACCOUNTS)
  }

  public async getAccount(accountIdentifier: string): Promise<AccountInfo | undefined> {
    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    return accounts.find((account) => account.accountIdentifier === accountIdentifier)
  }

  public async addAccount(accountInfo: AccountInfo): Promise<void> {
    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    if (!accounts.some((element) => element.accountIdentifier === accountInfo.accountIdentifier)) {
      accounts.push(accountInfo)
    }

    return this.storage.set(StorageKey.ACCOUNTS, accounts)
  }

  public async removeAccount(accountIdentifier: string): Promise<void> {
    const accounts = await this.storage.get(StorageKey.ACCOUNTS)

    const filteredAccounts = accounts.filter(
      (accountInfo) => accountInfo.accountIdentifier !== accountIdentifier
    )

    return this.storage.set(StorageKey.ACCOUNTS, filteredAccounts)
  }

  public async removeAllAccounts(): Promise<void> {
    return this.storage.delete(StorageKey.ACCOUNTS)
  }

  protected async _connect(): Promise<boolean> {
    if (this.transport && this.transport.connectionStatus === TransportStatus.NOT_CONNECTED) {
      await this.transport.connect()
      this.transport
        .addListener(async (message: unknown, connectionInfo: ConnectionContext) => {
          if (typeof message === 'string') {
            const deserializedMessage = (await new Serializer().deserialize(
              message
            )) as BeaconMessage
            this.handleResponse(deserializedMessage, connectionInfo)
          }
        })
        .catch((error) => console.log(error))
      this._isConnected.resolve(true)
    } else {
      this._isConnected.reject('no transport available')
    }

    return this._isConnected.promise
  }

  private async loadOrCreateBeaconSecret(): Promise<void> {
    const storageValue: unknown = await this.storage.get(StorageKey.BEACON_SDK_SECRET_SEED)
    if (storageValue && typeof storageValue === 'string') {
      this._keyPair.resolve(getKeypairFromSeed(storageValue))
    } else {
      const key = generateGUID()
      await this.storage.set(StorageKey.BEACON_SDK_SECRET_SEED, key)
      this._keyPair.resolve(getKeypairFromSeed(key))
    }
  }
}
