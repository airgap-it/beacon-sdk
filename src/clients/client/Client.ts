import * as sodium from 'libsodium-wrappers'
import { ExposedPromise, exposedPromise, ExposedPromiseStatus } from '../../utils/exposed-promise'
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
  BeaconMessage
} from '../..'
import { BeaconEventHandler, BeaconEvent } from '../../events'
import { Logger } from '../../utils/Logger'
import { ClientOptions } from './ClientOptions'

const logger = new Logger('BaseClient')

export abstract class Client {
  protected requestCounter: number[] = []

  protected handleResponse: (_event: BeaconMessage, connectionInfo: ConnectionContext) => void

  protected readonly name: string

  protected readonly rateLimit: number = 2
  protected readonly rateLimitWindowInSeconds: number = 5

  protected readonly events: BeaconEventHandler = new BeaconEventHandler()

  protected beaconId: string | undefined

  protected storage: Storage

  protected _keyPair: ExposedPromise<sodium.KeyPair> = exposedPromise()
  protected get keyPair(): Promise<sodium.KeyPair> {
    return this._keyPair.promise
  }

  protected _transport: ExposedPromise<Transport> = exposedPromise()
  protected get transport(): Promise<Transport> {
    return this._transport.promise
  }

  protected readonly _isConnected: ExposedPromise<boolean> = exposedPromise()
  public get isConnected(): Promise<boolean> {
    return this._isConnected.promise
  }

  public get ready(): Promise<void> {
    return this.transport.then(() => undefined)
  }

  constructor(config: ClientOptions) {
    this.name = config.name
    this.storage = config.storage

    if (config.eventHandlers) {
      this.events.overrideDefaults(config.eventHandlers).catch((overrideError: Error) => {
        logger.error('constructor', overrideError)
      })
    }

    this.handleResponse = (message: BeaconBaseMessage, connectionInfo: ConnectionContext): void => {
      throw new Error(`not overwritten${JSON.stringify(message)} - ${JSON.stringify(connectionInfo)}`)
    }

    this.loadOrCreateBeaconSecret().catch(console.error)
    this.keyPair
      .then((keyPair) => {
        this.beaconId = toHex(keyPair.publicKey)
      })
      .catch(console.error)
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
    if (this._transport.status === ExposedPromiseStatus.RESOLVED) {
      return (await this.transport).type
    }

    if (transport) {
      await this.setTransport(transport) // Let users define their own transport

      return transport.type
    } else {
      const newTransport = new P2PTransport(
        this.name,
        await this.keyPair,
        this.storage,
        this.events,
        isDapp
      )
      await this.setTransport(newTransport)

      PostMessageTransport.isAvailable().then(async postMessageAvailable => {
        if (postMessageAvailable) {
          this._transport = exposedPromise() // We know that the promise has already been resolved, so we need to create a new one
          await this.setTransport(new PostMessageTransport(this.name))
        }
      }).catch((postMessageError: Error) => { logger.error('init', postMessageError) })

      return newTransport.type
    }

  }
  public async getPeers(): Promise<string[]> {
    return (await this.transport).getPeers()
  }

  public async addPeer(id: string): Promise<void> {
    return (await this.transport).addPeer(id)
  }

  public async removePeer(id: string): Promise<void> {
    return (await this.transport).removePeer(id)
  }

  public async removeAllPeers(): Promise<void> {
    return (await this.transport).removeAllPeers()
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
    const transport: Transport = await this.transport
    if (transport && transport.connectionStatus === TransportStatus.NOT_CONNECTED) {
      await transport.connect()
      transport
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

  private async setTransport(transport: Transport): Promise<void> {
    this._transport.resolve(transport)
    this.events.emit(BeaconEvent.ACTIVE_TRANSPORT_SET, transport).catch(eventError => { logger.error('setTransport', eventError) })
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
