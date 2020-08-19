import { ExposedPromise, ExposedPromiseStatus } from '../../utils/exposed-promise'
import { ConnectionContext } from '../../types/ConnectionContext'
import {
  Serializer,
  PostMessageTransport,
  P2PTransport,
  Transport,
  TransportType,
  TransportStatus,
  BeaconBaseMessage,
  AccountInfo,
  P2PPairingRequest
} from '../..'
import { BeaconEventHandler, BeaconEvent } from '../../events'
import { isChromeExtensionInstalled } from '../../utils/is-extension-installed'
import { BeaconClient } from '../beacon-client/BeaconClient'
import { AccountManager } from '../../managers/AccountManager'
import { BeaconRequestMessage } from '../../types/beacon/BeaconRequestMessage'
import { ClientOptions } from './ClientOptions'

export abstract class Client extends BeaconClient {
  protected readonly accountManager: AccountManager

  protected requestCounter: number[] = []

  protected handleResponse: (
    _event: BeaconRequestMessage,
    connectionInfo: ConnectionContext
  ) => void

  protected readonly rateLimit: number = 2
  protected readonly rateLimitWindowInSeconds: number = 5

  protected readonly events: BeaconEventHandler

  protected readonly matrixNodes: string[]

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
    this.accountManager = new AccountManager(config.storage)
    this.matrixNodes = config.matrixNodes ?? []

    this.handleResponse = (message: BeaconBaseMessage, connectionInfo: ConnectionContext): void => {
      throw new Error(
        `not overwritten${JSON.stringify(message)} - ${JSON.stringify(connectionInfo)}`
      )
    }
  }

  public async getAccounts(): Promise<AccountInfo[]> {
    return this.accountManager.getAccounts()
  }

  public async getAccount(accountIdentifier: string): Promise<AccountInfo | undefined> {
    return this.accountManager.getAccount(accountIdentifier)
  }

  public async removeAccount(accountIdentifier: string): Promise<void> {
    return this.accountManager.removeAccount(accountIdentifier)
  }

  public async removeAllAccounts(): Promise<void> {
    return this.accountManager.removeAllAccounts()
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
            this.matrixNodes,
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

            return setTransport(new PostMessageTransport(this.name, keyPair, this.storage, isDapp))
          }
        })
      })
    }
  }
  public async getPeers(): Promise<P2PPairingRequest[]> {
    if ((await this.transport).type === TransportType.P2P) {
      return ((await this.transport) as P2PTransport).getPeers()
    } else {
      return []
    }
  }

  public async addPeer(id: P2PPairingRequest): Promise<void> {
    if ((await this.transport).type === TransportType.P2P) {
      return ((await this.transport) as P2PTransport).addPeer(id)
    }
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
            )) as BeaconRequestMessage
            this.handleResponse(deserializedMessage, connectionInfo)
          }
        })
        .catch((error) => console.log(error))
      this._isConnected.resolve(true)
    } else if (transport.connectionStatus === TransportStatus.CONNECTING) {
      await transport.reconnect()
    } else {
      // NO-OP
    }

    return this._isConnected.promise
  }

  private async setTransport(transport: Transport): Promise<void> {
    if (this._transport.isSettled()) {
      // If the promise has already been resolved we need to create a new one.
      this._transport = ExposedPromise.resolve(transport)
    } else {
      this._transport.resolve(transport)
    }

    await this.events.emit(BeaconEvent.ACTIVE_TRANSPORT_SET, transport)
  }
}
