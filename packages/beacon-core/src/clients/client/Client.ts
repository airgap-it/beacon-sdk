import { ExposedPromise, ExposedPromiseStatus, generateGUID } from '@mavrykdynamics/beacon-utils'
import {
  ConnectionContext,
  TransportType,
  TransportStatus,
  BeaconBaseMessage,
  AccountInfo,
  PeerInfo,
  BeaconMessageType,
  DisconnectMessage,
  AppMetadata,
  BeaconRequestMessage,
  BeaconMessageWrapper,
  NodeDistributions
} from '@mavrykdynamics/beacon-types'
import { Serializer, Transport } from '../..'
import { BeaconClient } from '../beacon-client/BeaconClient'
import { AccountManager } from '../../managers/AccountManager'
import { getSenderId } from '../../utils/get-sender-id'
import { Logger } from '../../utils/Logger'
import { ClientOptions } from './ClientOptions'

const logger = new Logger('Client')

/**
 * @internalapi
 *
 * This abstract class handles the a big part of the logic that is shared between the dapp and wallet client.
 * For example, it selects and manages the transport and accounts.
 */
export abstract class Client extends BeaconClient {
  protected readonly accountManager: AccountManager

  protected handleResponse: (
    _event: BeaconRequestMessage | BeaconMessageWrapper<BeaconBaseMessage>,
    connectionInfo: ConnectionContext
  ) => void

  /**
   * How many requests can be sent after another
   */
  protected readonly rateLimit: number = 2
  /**
   * The time window in seconds in which the "rateLimit" is checked
   */
  protected readonly rateLimitWindowInSeconds: number = 5

  /**
   * Stores the times when requests have been made to determine if the rate limit has been reached
   */
  protected requestCounter: number[] = []

  protected readonly matrixNodes: NodeDistributions

  protected _transport: ExposedPromise<Transport<any>> = new ExposedPromise()
  protected get transport(): Promise<Transport<any>> {
    return this._transport.promise
  }

  /**
   * Returns the connection status of the Client
   */
  public get connectionStatus(): TransportStatus {
    return this._transport.promiseResult?.connectionStatus ?? TransportStatus.NOT_CONNECTED
  }

  /**
   * Returns whether or not the transaport is ready
   */
  public get ready(): Promise<void> {
    return this.transport.then(() => undefined)
  }

  constructor(config: ClientOptions) {
    super(config)

    this.accountManager = new AccountManager(config.storage)
    this.matrixNodes = config.matrixNodes ?? {}

    this.handleResponse = (
      message: BeaconBaseMessage | BeaconMessageWrapper<BeaconBaseMessage>,
      connectionInfo: ConnectionContext
    ): void => {
      throw new Error(
        `not overwritten${JSON.stringify(message)} - ${JSON.stringify(connectionInfo)}`
      )
    }
  }

  /**
   * Return all locally known accounts
   */
  public async getAccounts(): Promise<AccountInfo[]> {
    return this.accountManager.getAccounts()
  }

  /**
   * Return the account by ID
   * @param accountIdentifier The ID of an account
   */
  public async getAccount(accountIdentifier: string): Promise<AccountInfo | undefined> {
    return this.accountManager.getAccount(accountIdentifier)
  }

  /**
   * Remove the account by ID
   * @param accountIdentifier The ID of an account
   */
  public async removeAccount(accountIdentifier: string): Promise<void> {
    return this.accountManager.removeAccount(accountIdentifier)
  }

  /**
   * Remove all locally stored accounts
   */
  public async removeAllAccounts(): Promise<void> {
    return this.accountManager.removeAllAccounts()
  }

  /**
   * Add a new request (current timestamp) to the pending requests, remove old ones and check if we are above the limit
   */
  public async addRequestAndCheckIfRateLimited(): Promise<boolean> {
    const now: number = new Date().getTime()
    this.requestCounter = this.requestCounter.filter(
      (date) => date + this.rateLimitWindowInSeconds * 1000 > now
    )

    this.requestCounter.push(now)

    return this.requestCounter.length > this.rateLimit
  }

  /**
   * This method initializes the client. It will check if the connection should be established to a
   * browser extension or if the P2P transport should be used.
   *
   * @param transport A transport that can be provided by the user
   */
  public async init(transport: Transport<any>): Promise<TransportType> {
    if (this._transport.status === ExposedPromiseStatus.RESOLVED) {
      return (await this.transport).type
    }

    await this.setTransport(transport) // Let users define their own transport

    return transport.type
  }

  /**
   * Returns the metadata of this DApp
   */
  public async getOwnAppMetadata(): Promise<AppMetadata> {
    return {
      senderId: await getSenderId(await this.beaconId),
      name: this.name,
      icon: this.iconUrl
    }
  }

  /**
   * Return all known peers
   */
  public async getPeers(): Promise<PeerInfo[]> {
    return (await this.transport).getPeers()
  }

  /**
   * Add a new peer to the known peers
   * @param peer The new peer to add
   */
  public async addPeer(peer: PeerInfo): Promise<void> {
    return (await this.transport).addPeer(peer)
  }

  public async destroy(): Promise<void> {
    if (this._transport.status === ExposedPromiseStatus.RESOLVED) {
      await (await this.transport).disconnect()
    }
    await super.destroy()
  }

  /**
   * A "setter" for when the transport needs to be changed.
   */
  protected async setTransport(transport?: Transport<any>): Promise<void> {
    if (transport) {
      if (this._transport.isSettled()) {
        // If the promise has already been resolved we need to create a new one.
        this._transport = ExposedPromise.resolve(transport)
      } else {
        this._transport.resolve(transport)
      }
    } else {
      if (this._transport.isSettled()) {
        // If the promise has already been resolved we need to create a new one.
        this._transport = new ExposedPromise()
      }
    }
  }

  protected async addListener(transport: Transport<any>): Promise<void> {
    transport
      .addListener(async (message: unknown, connectionInfo: ConnectionContext) => {
        if (typeof message === 'string') {
          const deserializedMessage = (await new Serializer().deserialize(
            message
          )) as BeaconRequestMessage
          this.handleResponse(deserializedMessage, connectionInfo)
        }
      })
      .catch((error) => logger.error('addListener', error))
  }

  protected async sendDisconnectToPeer(peer: PeerInfo, transport?: Transport<any>): Promise<void> {
    const request: DisconnectMessage = {
      id: await generateGUID(),
      version: peer.version,
      senderId: await getSenderId(await this.beaconId),
      type: BeaconMessageType.Disconnect
    }

    const payload = await new Serializer().serialize(request)
    const selectedTransport = transport ?? (await this.transport)

    await selectedTransport.send(payload, peer)
  }
}
