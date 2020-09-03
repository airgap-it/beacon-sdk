import { ExposedPromise } from '../../utils/exposed-promise'

import { Logger } from '../../utils/Logger'
import { generateGUID } from '../../utils/generate-uuid'
import { BeaconEvent, BeaconEventHandlerFunction, BeaconEventType } from '../../events'
import { BEACON_VERSION } from '../../constants'
import { getAddressFromPublicKey } from '../../utils/crypto'
import { ConnectionContext } from '../../types/ConnectionContext'
import {
  AccountInfo,
  Client,
  TransportType,
  Transport,
  StorageKey,
  BeaconMessageType,
  PermissionScope,
  PermissionResponse,
  NetworkType,
  SignPayloadResponse,
  SignPayloadRequest,
  OperationResponse,
  OperationRequest,
  BroadcastResponse,
  BroadcastRequest,
  ErrorResponse,
  BeaconMessage,
  RequestPermissionInput,
  RequestSignPayloadInput,
  RequestOperationInput,
  RequestBroadcastInput,
  PermissionRequest,
  AppMetadata,
  Serializer,
  LocalStorage,
  PermissionResponseOutput,
  PermissionRequestInput,
  SignPayloadResponseOutput,
  SignPayloadRequestInput,
  OperationResponseOutput,
  OperationRequestInput,
  BroadcastResponseOutput,
  BroadcastRequestInput,
  BeaconRequestInputMessage,
  Network,
  P2PPairingRequest,
  P2PTransport,
  BeaconError
} from '../..'
import { messageEvents } from '../../beacon-message-events'
import { IgnoredRequestInputProperties } from '../../types/beacon/messages/BeaconRequestInputMessage'
import { getAccountIdentifier } from '../../utils/get-account-identifier'
import { DAppClientOptions } from './DAppClientOptions'

const logger = new Logger('DAppClient')

/**
 * The DAppClient has to be used in decentralized applications. It handles all the logic related to connecting to beacon-compatible
 * wallets and sending requests.
 */
export class DAppClient extends Client {
  /**
   * The URL of the dApp Icon. This can be used to display the icon of the dApp on in the wallet
   */
  public readonly iconUrl?: string

  /**
   * A map of requests that are currently "open", meaning we have sent them to a wallet and are still awaiting a response.
   */
  private readonly openRequests = new Map<
    string,
    ExposedPromise<{ message: BeaconMessage; connectionInfo: ConnectionContext }, ErrorResponse>
  >()

  /**
   * The currently active account. For all requests that are associated to a specific request (operation request, signing request),
   * the active account is used to determine the network and destination wallet
   */
  private _activeAccount: ExposedPromise<AccountInfo | undefined> = new ExposedPromise()

  /**
   * Returns the status if the transport is connected
   */
  public get isConnected(): Promise<boolean> {
    return this._isConnected.promise
  }

  constructor(config: DAppClientOptions) {
    super({
      storage: config.storage ? config.storage : new LocalStorage(),
      ...config
    })
    this.iconUrl = config.iconUrl

    this.storage
      .get(StorageKey.ACTIVE_ACCOUNT)
      .then(async (activeAccountIdentifier) => {
        if (activeAccountIdentifier) {
          await this.setActiveAccount(await this.accountManager.getAccount(activeAccountIdentifier))
        } else {
          await this.setActiveAccount(undefined)
        }
      })
      .catch(async (storageError) => {
        await this.setActiveAccount(undefined)
        console.error(storageError)
      })

    this.handleResponse = async (
      message: BeaconMessage,
      connectionInfo: ConnectionContext
    ): Promise<void> => {
      const openRequest = this.openRequests.get(message.id)
      if (openRequest) {
        if (message.type === BeaconMessageType.Error) {
          openRequest.reject(message)
        } else {
          openRequest.resolve({ message, connectionInfo })
        }
        this.openRequests.delete(message.id)
      } else {
        if (message.type === BeaconMessageType.Disconnect) {
          const transport = await this.transport
          if (transport.type === TransportType.P2P) {
            // TODO: Also handle postmessage transport
            await (transport as P2PTransport).removePeer({
              name: '',
              publicKey: message.senderId,
              version: BEACON_VERSION,
              relayServer: ''
            })
            await this.events.emit(BeaconEvent.P2P_CHANNEL_CLOSED)
          }
        } else {
          logger.error('handleResponse', 'no request found for id ', message.id)
        }
      }
    }
  }

  public async init(_isDapp?: boolean, transport?: Transport): Promise<TransportType> {
    const initResponse = await super.init(true, transport)

    return initResponse
  }

  /**
   * Returns the active account
   */
  public async getActiveAccount(): Promise<AccountInfo | undefined> {
    return this._activeAccount.promise
  }

  /**
   * Sets the active account
   *
   * @param account The account that will be set as the active account
   */
  public async setActiveAccount(account?: AccountInfo): Promise<void> {
    if (this._activeAccount.isSettled()) {
      // If the promise has already been resolved we need to create a new one.
      this._activeAccount = ExposedPromise.resolve<AccountInfo | undefined>(account)
    } else {
      this._activeAccount.resolve(account)
    }

    await this.storage.set(
      StorageKey.ACTIVE_ACCOUNT,
      account ? account.accountIdentifier : undefined
    )

    await this.events.emit(BeaconEvent.ACTIVE_ACCOUNT_SET, account)

    return
  }

  /**
   * Returns the metadata of this DApp
   */
  public async getAppMetadata(): Promise<AppMetadata> {
    return {
      senderId: await this.beaconId,
      name: this.name,
      icon: this.iconUrl
    }
  }

  /**
   * The method will attempt to initiate a connection using the active transport method.
   * If the method is called multiple times while it is connecting (meaning the initial connect didn't finish),
   * the transport will try to reconnect.
   */
  public async connect(): Promise<boolean> {
    return super._connect()
  }

  /**
   * Will remove the account from the local storage and set a new active account if necessary.
   *
   * @param accountIdentifier ID of the account
   */
  public async removeAccount(accountIdentifier: string): Promise<void> {
    const removeAccountResult = super.removeAccount(accountIdentifier)
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()

    if (activeAccount && activeAccount.accountIdentifier === accountIdentifier) {
      await this.setActiveAccount(undefined)
    }

    return removeAccountResult
  }

  /**
   * Removes a peer and all the accounts that have been connected through that peer
   *
   * @param peer Peer to be removed
   */
  public async removePeer(peer: P2PPairingRequest): Promise<void> {
    if ((await this.transport).type === TransportType.P2P) {
      // TODO: Allow for other transport types?
      const removePeerResult = ((await this.transport) as P2PTransport).removePeer(peer)

      await this.removeAccountsForPeers([peer])

      return removePeerResult
    }
  }

  /**
   * Remove all peers and all accounts that have been connected through those peers
   */
  public async removeAllPeers(): Promise<void> {
    if ((await this.transport).type === TransportType.P2P) {
      // TODO: Allow for other transport types?
      const peers: P2PPairingRequest[] = await ((await this.transport) as P2PTransport).getPeers()
      const removePeerResult = ((await this.transport) as P2PTransport).removeAllPeers()

      await this.removeAccountsForPeers(peers)

      return removePeerResult
    }
  }

  /**
   * Allows the user to subscribe to specific events that are fired in the SDK
   *
   * @param internalEvent The event to subscribe to
   * @param eventCallback The callback that will be called when the event occurs
   */
  public async subscribeToEvent<K extends BeaconEvent>(
    internalEvent: K,
    eventCallback: BeaconEventHandlerFunction<BeaconEventType[K]>
  ): Promise<void> {
    await this.events.on(internalEvent, eventCallback)
  }

  /**
   * Check if we have permissions to send the specific message type to the active account.
   * If no active account is set, only permission requests are allowed.
   *
   * @param type The type of the message
   */
  public async checkPermissions(type: BeaconMessageType): Promise<boolean> {
    if (type === BeaconMessageType.PermissionRequest) {
      return true
    }

    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()

    if (!activeAccount) {
      throw await this.sendInternalError('No active account set!')
    }

    const permissions = activeAccount.scopes

    switch (type) {
      case BeaconMessageType.OperationRequest:
        return permissions.includes(PermissionScope.OPERATION_REQUEST)
      case BeaconMessageType.SignPayloadRequest:
        return permissions.includes(PermissionScope.SIGN)
      case BeaconMessageType.BroadcastRequest:
        return true
      default:
        return false
    }
  }

  /**
   * Send a permission request to the DApp. This should be done as the first step. The wallet will respond
   * with an publicKey and permissions that were given. The account returned will be set as the "activeAccount"
   * and will be used for the following requests.
   *
   * @param input The message details we need to prepare the PermissionRequest message.
   */
  public async requestPermissions(
    input?: RequestPermissionInput
  ): Promise<PermissionResponseOutput> {
    const request: PermissionRequestInput = {
      appMetadata: await this.getAppMetadata(),
      type: BeaconMessageType.PermissionRequest,
      network: input && input.network ? input.network : { type: NetworkType.MAINNET },
      scopes:
        input && input.scopes
          ? input.scopes
          : [PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN]
    }

    const { message, connectionInfo } = await this.makeRequest<
      PermissionRequest,
      PermissionResponse
    >(request).catch(async (requestError: ErrorResponse) => {
      throw this.handleRequestError(request, requestError)
    })

    // TODO: Migration code. Remove sometime after 1.0.0 release.
    const publicKey = message.publicKey || (message as any).pubkey || (message as any).pubKey
    const address = await getAddressFromPublicKey(publicKey)

    const accountInfo: AccountInfo = {
      accountIdentifier: await getAccountIdentifier(address, message.network),
      senderId: message.senderId,
      origin: {
        type: connectionInfo.origin,
        id: connectionInfo.id
      },
      address,
      publicKey,
      network: message.network,
      scopes: message.scopes,
      threshold: message.threshold,
      connectedAt: new Date().getTime()
    }

    await this.accountManager.addAccount(accountInfo)
    await this.setActiveAccount(accountInfo)

    const { senderId, network, scopes, threshold } = message

    const output: PermissionResponseOutput = {
      senderId,
      address,
      network,
      scopes,
      publicKey,
      threshold
    } // TODO: Should we return the account info here?

    await this.notifySuccess(request, {
      account: accountInfo,
      output,
      connectionContext: connectionInfo
    })

    return output
  }

  /**
   * This method will send a "SignPayloadRequest" to the wallet. This method is meant to be used to sign
   * arbitrary data (eg. a string). It will return the signature in the format of "edsig..."
   *
   * @param input The message details we need to prepare the SignPayloadRequest message.
   */
  public async requestSignPayload(
    input: RequestSignPayloadInput
  ): Promise<SignPayloadResponseOutput> {
    if (!input.payload) {
      throw await this.sendInternalError('Payload must be provided')
    }
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
    if (!activeAccount) {
      throw await this.sendInternalError('No active account!')
    }

    const request: SignPayloadRequestInput = {
      type: BeaconMessageType.SignPayloadRequest,
      payload: input.payload,
      sourceAddress: input.sourceAddress || activeAccount.address
    }

    const { message, connectionInfo } = await this.makeRequest<
      SignPayloadRequest,
      SignPayloadResponse
    >(request).catch(async (requestError: ErrorResponse) => {
      throw this.handleRequestError(request, requestError)
    })

    const { senderId, signature } = message

    const output: SignPayloadResponseOutput = { senderId, signature }

    await this.notifySuccess(request, {
      account: activeAccount,
      output,
      connectionContext: connectionInfo
    })

    return output
  }

  /**
   * This method sends an OperationRequest to the wallet. This method should be used for all kinds of operations,
   * eg. transaction or delegation. Not all properties have to be provided. Data like "counter" and fees will be
   * fetched and calculated by the wallet (but they can still be provided if required).
   *
   * @param input The message details we need to prepare the OperationRequest message.
   */
  public async requestOperation(input: RequestOperationInput): Promise<OperationResponseOutput> {
    if (!input.operationDetails) {
      throw await this.sendInternalError('Operation details must be provided')
    }
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
    if (!activeAccount) {
      throw await this.sendInternalError('No active account!')
    }

    const request: OperationRequestInput = {
      type: BeaconMessageType.OperationRequest,
      network: activeAccount.network || { type: NetworkType.MAINNET },
      operationDetails: input.operationDetails,
      sourceAddress: activeAccount.address || ''
    }

    const { message, connectionInfo } = await this.makeRequest<OperationRequest, OperationResponse>(
      request
    ).catch(async (requestError: ErrorResponse) => {
      throw this.handleRequestError(request, requestError)
    })

    const { senderId, transactionHash } = message

    const output: OperationResponseOutput = { senderId, transactionHash }

    await this.notifySuccess(request, {
      account: activeAccount,
      output,
      connectionContext: connectionInfo
    })

    return { senderId, transactionHash }
  }

  /**
   * Sends a "BroadcastRequest" to the wallet. This method can be used to inject an already signed transaction
   * to the network.
   *
   * @param input The message details we need to prepare the BroadcastRequest message.
   */
  public async requestBroadcast(input: RequestBroadcastInput): Promise<BroadcastResponseOutput> {
    if (!input.signedTransaction) {
      throw await this.sendInternalError('Signed transaction must be provided')
    }

    const network = input.network || { type: NetworkType.MAINNET }

    const request: BroadcastRequestInput = {
      type: BeaconMessageType.BroadcastRequest,
      network,
      signedTransaction: input.signedTransaction
    }

    const { message, connectionInfo } = await this.makeRequest<BroadcastRequest, BroadcastResponse>(
      request
    ).catch(async (requestError: ErrorResponse) => {
      throw this.handleRequestError(request, requestError)
    })

    const { senderId, transactionHash } = message

    const output: BroadcastResponseOutput = { senderId, transactionHash }

    await this.notifySuccess(request, { network, output, connectionContext: connectionInfo })

    return { senderId, transactionHash }
  }

  /**
   * This method will emit an internal error message.
   *
   * @param errorMessage The error message to send.
   */
  private async sendInternalError(errorMessage: string): Promise<void> {
    await this.events.emit(BeaconEvent.INTERNAL_ERROR, errorMessage)
    throw new Error(errorMessage)
  }

  /**
   * This method will remove all accounts associated with a specific peer.
   *
   * @param peersToRemove An array of peers for which accounts should be removed
   */
  private async removeAccountsForPeers(peersToRemove: P2PPairingRequest[]): Promise<void> {
    const accounts = await this.accountManager.getAccounts()

    const peerIdsToRemove = peersToRemove.map((peer) => peer.publicKey)
    // Remove all accounts with origin of the specified peer
    const accountsToRemove = accounts.filter((account) =>
      peerIdsToRemove.includes(account.origin.id)
    )
    const accountIdentifiersToRemove = accountsToRemove.map(
      (accountInfo) => accountInfo.accountIdentifier
    )
    await this.accountManager.removeAccounts(accountIdentifiersToRemove)

    // Check if one of the accounts that was removed was the active account and if yes, set it to undefined
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()

    if (activeAccount) {
      if (accountIdentifiersToRemove.includes(activeAccount.accountIdentifier)) {
        await this.setActiveAccount(undefined)
      }
    }
  }

  /**
   * This message handles errors that we receive from the wallet.
   *
   * @param request The request we sent
   * @param beaconError The error we received
   */
  private async handleRequestError(
    request: BeaconRequestInputMessage,
    beaconError: ErrorResponse
  ): Promise<void> {
    if (beaconError.errorType) {
      this.events
        .emit(messageEvents[request.type].error, beaconError)
        .catch((emitError) => console.warn(emitError))

      throw BeaconError.getError(beaconError.errorType)
    }

    console.error('requestError', beaconError)

    throw beaconError
  }

  /**
   * This message will send an event when we receive a successful response to one of the requests we sent.
   *
   * @param request The request we sent
   * @param response The response we received
   */
  private async notifySuccess(
    request: BeaconRequestInputMessage,
    response:
      | {
          account: AccountInfo
          output: PermissionResponseOutput
          connectionContext: ConnectionContext
        }
      | {
          account: AccountInfo
          output: OperationResponseOutput
          connectionContext: ConnectionContext
        }
      | {
          output: SignPayloadResponseOutput
          connectionContext: ConnectionContext
        }
      | {
          network: Network
          output: BroadcastResponseOutput
          connectionContext: ConnectionContext
        }
  ): Promise<void> {
    this.events
      .emit(messageEvents[request.type].success, response)
      .catch((emitError) => console.warn(emitError))
  }

  /**
   * This method handles sending of requests to the DApp. It makes sure that the DAppClient is initialized and connected
   * to the transport. After that rate limits and permissions will be checked, an ID is attached and the request is sent
   * to the DApp over the transport.
   *
   * @param requestInput The BeaconMessage to be sent to the wallet
   * @param account The account that the message will be sent to
   */
  private async makeRequest<T extends BeaconRequestInputMessage, U extends BeaconMessage>(
    requestInput: Omit<T, IgnoredRequestInputProperties>,
    account?: AccountInfo
  ): Promise<{
    message: U
    connectionInfo: ConnectionContext
  }> {
    logger.log('makeRequest')
    await this.init()
    logger.log('makeRequest', 'after init')
    await this.connect()
    logger.log('makeRequest', 'after connecting')

    if (await this.addRequestAndCheckIfRateLimited()) {
      this.events
        .emit(BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch((emitError) => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    if (!(await this.checkPermissions(requestInput.type))) {
      this.events.emit(BeaconEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError))

      throw new Error('No permissions to send this request to wallet!')
    }

    if (!this.beaconId) {
      throw await this.sendInternalError('BeaconID not defined')
    }

    const request: Omit<T, IgnoredRequestInputProperties> &
      Pick<U, IgnoredRequestInputProperties> = {
      id: await generateGUID(),
      version: BEACON_VERSION,
      senderId: await this.beaconId,
      ...requestInput
    }

    const exposed = new ExposedPromise<
      { message: BeaconMessage; connectionInfo: ConnectionContext },
      ErrorResponse
    >()

    this.addOpenRequest(request.id, exposed)

    const payload = await new Serializer().serialize(request)

    let origin: string | undefined
    if (account) {
      origin = account.senderId
    }

    await (await this.transport).send(payload, origin)

    this.events
      .emit(messageEvents[requestInput.type].sent)
      .catch((emitError) => console.warn(emitError))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return exposed.promise as any // TODO: fix type
  }

  /**
   * Adds a requests to the "openRequests" set so we know what messages have already been answered/handled.
   *
   * @param id The ID of the message
   * @param promise A promise that resolves once the response for that specific message is received
   */
  private addOpenRequest(
    id: string,
    promise: ExposedPromise<
      { message: BeaconMessage; connectionInfo: ConnectionContext },
      ErrorResponse
    >
  ): void {
    logger.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`)
    this.openRequests.set(id, promise)
  }
}
