import { ExposedPromise, ExposedPromiseStatus } from '../../utils/exposed-promise'
import { ConnectionContext } from '../../types/ConnectionContext'
import {
  Serializer,
  PostMessageTransport,
  P2PTransport,
  Transport,
  TransportType,
  TransportStatus,
  StorageKey,
  AccountInfo,
  BeaconBaseMessage,
  BeaconMessage
} from '../..'
import { BeaconEventHandler, BeaconEvent } from '../../events'
import { Logger } from '../../utils/Logger'
import { isChromeExtensionInstalled } from '../../utils/is-extension-installed'
import { BeaconClient } from '../beacon-client/BeaconClient'
import { ClientOptions } from './ClientOptions'

const logger = new Logger('BaseClient')

export abstract class Client extends BeaconClient {
  protected requestCounter: number[] = []

  protected handleResponse: (_event: BeaconMessage, connectionInfo: ConnectionContext) => void

  protected readonly rateLimit: number = 2
  protected readonly rateLimitWindowInSeconds: number = 5

  protected readonly events: BeaconEventHandler

  protected _transport: ExposedPromise<Transport> = new ExposedPromise()
  protected get transport(): Promise<Transport> {
    return this._transport.promise
  }

  protected readonly _isConnected: ExposedPromise<boolean> = new ExposedPromise()
  public get isConnected(): Promise<boolean> {
    return this._isConnected.promise
  }

  public get ready(): Promise<void> {
    return this.transport.then(() => undefined)
  }

  constructor(config: ClientOptions) {
    super({ name: config.name, storage: config.storage })

    this.events = new BeaconEventHandler(config.eventHandlers)

    this.handleResponse = (message: BeaconBaseMessage, connectionInfo: ConnectionContext): void => {
      throw new Error(
        `not overwritten${JSON.stringify(message)} - ${JSON.stringify(connectionInfo)}`
      )
    }
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
      return new Promise(async (resolve) => {
        const keyPair = await this.keyPair // We wait for keypair here so the P2P Transport creation is not delayed and causing issues

        const setTransport = async (newTransport: Transport): Promise<void> => {
          await this.setTransport(newTransport)
          resolve(newTransport.type)
        }

        const setBeaconTransport = async (): Promise<void> => {
          const newTransport = new P2PTransport(
            this.name,
            keyPair,
            this.storage,
            this.events,
            isDapp
          )

          return setTransport(newTransport)
        }

        const setBeaconTransportTimeout = setTimeout(setBeaconTransport, 200)

        return isChromeExtensionInstalled.then(async (postMessageAvailable) => {
          if (postMessageAvailable) {
            if (setBeaconTransportTimeout) {
              clearTimeout(setBeaconTransportTimeout)
            }

            return setTransport(new PostMessageTransport(this.name))
          }
        })
      })
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
    if (transport.connectionStatus === TransportStatus.NOT_CONNECTED) {
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
      await transport.reconnect()
    }

    return this._isConnected.promise
  }

  private async setTransport(transport: Transport): Promise<void> {
    if (this._transport.isSettled()) {
      this._transport = new ExposedPromise() // If the promise has already been resolved we need to create a new one.
    }
    this._transport.resolve(transport)
    this.events.emit(BeaconEvent.ACTIVE_TRANSPORT_SET, transport).catch((eventError) => {
      logger.error('setTransport', eventError)
    })
  }
}
