import { ExposedPromise, exposedPromise } from '../utils/exposed-promise'

import { Logger } from '../utils/Logger'
import { generateGUID } from '../utils/generate-uuid'
import { InternalEvent, InternalEventHandler } from '../events'
import { SDK_VERSION } from '../constants'
import { IgnoredInputProperties } from '../types/beacon/IgnoredInputProperties'
import { getAddressFromPublicKey } from '../utils/crypto'
import { ConnectionContext } from '../types/ConnectionContext'
import {
  AccountInfo,
  BaseClient,
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
  BeaconErrorMessage,
  BeaconMessages,
  RequestPermissionInput,
  RequestSignPayloadInput,
  RequestOperationInput,
  RequestBroadcastInput,
  PermissionRequest,
  AppMetadata,
  BeaconBaseMessage,
  Serializer,
  LocalStorage,
  Storage
} from '..'

const logger = new Logger('DAppClient')

export type PermissionRequestInput = Omit<PermissionRequest, IgnoredInputProperties>
export type OperationRequestInput = Omit<OperationRequest, IgnoredInputProperties>
export type SignPayloadRequestInput = Omit<SignPayloadRequest, IgnoredInputProperties>
export type BroadcastRequestInput = Omit<BroadcastRequest, IgnoredInputProperties>

export type BeaconMessagesInput =
  | PermissionRequestInput
  | OperationRequestInput
  | SignPayloadRequestInput
  | BroadcastRequestInput

export type IgnoredOutputProperties = 'id' | 'version' | 'type'

export type PermissionResponseOutput = Omit<
  Omit<PermissionResponse, IgnoredOutputProperties>,
  'accountIdentifier' | 'pubkey'
> & { address?: string }
export type OperationResponseOutput = Omit<OperationResponse, IgnoredOutputProperties>
export type SignPayloadResponseOutput = Omit<SignPayloadResponse, IgnoredOutputProperties>
export type BroadcastResponseOutput = Omit<BroadcastResponse, IgnoredOutputProperties>

export type BeaconMessagesOutput =
  | PermissionResponseOutput
  | OperationResponseOutput
  | SignPayloadResponseOutput
  | BroadcastResponseOutput

const messageEvents: {
  [key in BeaconMessageType]: { success: InternalEvent; error: InternalEvent }
} = {
  [BeaconMessageType.PermissionRequest]: {
    success: InternalEvent.PERMISSION_REQUEST_SENT,
    error: InternalEvent.PERMISSION_REQUEST_ERROR
  },
  [BeaconMessageType.PermissionResponse]: {
    success: InternalEvent.UNKNOWN,
    error: InternalEvent.UNKNOWN
  },
  [BeaconMessageType.OperationRequest]: {
    success: InternalEvent.OPERATION_REQUEST_SENT,
    error: InternalEvent.OPERATION_REQUEST_ERROR
  },
  [BeaconMessageType.OperationResponse]: {
    success: InternalEvent.UNKNOWN,
    error: InternalEvent.UNKNOWN
  },
  [BeaconMessageType.SignPayloadRequest]: {
    success: InternalEvent.SIGN_REQUEST_SENT,
    error: InternalEvent.SIGN_REQUEST_ERROR
  },
  [BeaconMessageType.SignPayloadResponse]: {
    success: InternalEvent.UNKNOWN,
    error: InternalEvent.UNKNOWN
  },
  [BeaconMessageType.BroadcastRequest]: {
    success: InternalEvent.BROADCAST_REQUEST_SENT,
    error: InternalEvent.BROADCAST_REQUEST_ERROR
  },
  [BeaconMessageType.BroadcastResponse]: {
    success: InternalEvent.UNKNOWN,
    error: InternalEvent.UNKNOWN
  }
}

export class DAppClient extends BaseClient {
  private readonly events: InternalEventHandler = new InternalEventHandler()
  private readonly openRequests = new Map<
    string,
    ExposedPromise<
      { message: BeaconMessages; connectionInfo: ConnectionContext },
      BeaconErrorMessage
    >
  >()
  private readonly iconUrl?: string

  private activeAccount: AccountInfo | undefined

  public get isConnected(): Promise<boolean> {
    return this._isConnected.promise
  }

  constructor(config: { name: string; iconUrl?: string; storage?: Storage }) {
    super({
      storage: config.storage ? config.storage : new LocalStorage(),
      ...config
    })
    this.iconUrl = config.iconUrl

    this.handleResponse = (event: BeaconMessages, connectionInfo: ConnectionContext): void => {
      const openRequest = this.openRequests.get(event.id)
      if (openRequest) {
        logger.log('handleResponse', 'found openRequest', event.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (((event as any) as BeaconErrorMessage).errorType) {
          openRequest.reject((event as any) as BeaconErrorMessage)
        } else {
          openRequest.resolve({ message: event, connectionInfo })
        }
        this.openRequests.delete(event.id)
      } else {
        logger.error('handleResponse', 'no request found for id ', event.id)
      }
    }
  }

  public addOpenRequest(
    id: string,
    promise: ExposedPromise<
      { message: BeaconMessages; connectionInfo: ConnectionContext },
      BeaconErrorMessage
    >
  ): void {
    logger.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`)
    this.openRequests.set(id, promise)
  }

  public async init(_isDapp?: boolean, transport?: Transport): Promise<TransportType> {
    const initResponse = await super.init(true, transport)
    if (!this.storage) {
      throw new Error('Storage not defined after init!')
    }

    this.storage
      .get(StorageKey.ACTIVE_ACCOUNT)
      .then(async (activeAccount) => {
        if (activeAccount) {
          await this.setActiveAccount(await this.getAccount(activeAccount))
        }
      })
      .catch((storageError) => {
        console.error(storageError)
      })

    return initResponse
  }

  public async getActiveAccount(): Promise<AccountInfo | undefined> {
    return this.activeAccount
  }

  public async getAppMetadata(): Promise<AppMetadata> {
    if (!this.beaconId) {
      throw new Error('BeaconID not defined')
    }

    return {
      beaconId: this.beaconId,
      name: this.name,
      icon: this.iconUrl
    }
  }

  public async connect(): Promise<boolean> {
    return super._connect()
  }

  public async checkPermissions(type: BeaconMessageType): Promise<boolean> {
    const accountInfo = this.activeAccount

    if (!accountInfo) {
      throw new Error('No active account set!')
    }

    switch (type) {
      case BeaconMessageType.OperationRequest:
        return accountInfo.scopes.some(
          (permission) => permission === PermissionScope.OPERATION_REQUEST
        )
      case BeaconMessageType.SignPayloadRequest:
        return accountInfo.scopes.some((permission) => permission === PermissionScope.SIGN)
      case BeaconMessageType.PermissionRequest:
      case BeaconMessageType.BroadcastRequest:
        return true
      default:
        return false
    }
  }

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
          : [PermissionScope.READ_ADDRESS, PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN]
    }

    const response = await this.makeRequest<PermissionRequest, PermissionResponse>(request).catch(
      async (requestError: Error) => {
        throw this.handleRequestError(request, requestError)
      }
    )

    const { message, connectionInfo } = response
    await this.handleBeaconError(message)

    const address = message.pubkey ? await getAddressFromPublicKey(message.pubkey) : undefined

    const accountInfo: AccountInfo = {
      accountIdentifier: message.accountIdentifier,
      beaconId: message.beaconId,
      origin: {
        type: connectionInfo.origin,
        id: connectionInfo.id
      },
      address,
      pubkey: message.pubkey,
      network: message.network,
      scopes: message.scopes,
      connectedAt: new Date()
    }

    await this.addAccount(accountInfo)
    await this.setActiveAccount(accountInfo)
    console.log('permissions interception', response)

    const { beaconId, network, scopes } = message

    return { beaconId, address, network, scopes }
  }

  public async requestSignPayload(
    input: RequestSignPayloadInput
  ): Promise<SignPayloadResponseOutput> {
    if (!input.payload) {
      throw new Error('Payload must be provided')
    }

    const request: SignPayloadRequestInput = {
      type: BeaconMessageType.SignPayloadRequest,
      payload: input.payload,
      sourceAddress: input.sourceAddress || ''
    }

    const response = await this.makeRequest<SignPayloadRequest, SignPayloadResponse>(request).catch(
      async (requestError: Error) => {
        throw this.handleRequestError(request, requestError)
      }
    )
    await this.handleBeaconError(response.message)

    const { beaconId, signature } = response.message

    return { beaconId, signature }
  }

  public async requestOperation(input: RequestOperationInput): Promise<OperationResponseOutput> {
    if (!input.operationDetails) {
      throw new Error('Operation details must be provided')
    }

    const request: OperationRequestInput = {
      type: BeaconMessageType.OperationRequest,
      network: input.network || { type: NetworkType.MAINNET },
      operationDetails: input.operationDetails as any // TODO: Fix type
    }

    const response = await this.makeRequest<OperationRequest, OperationResponse>(request).catch(
      async (requestError: Error) => {
        throw this.handleRequestError(request, requestError)
      }
    )
    await this.handleBeaconError(response.message)

    const { beaconId, transactionHash } = response.message

    return { beaconId, transactionHash }
  }

  public async requestBroadcast(input: RequestBroadcastInput): Promise<BroadcastResponseOutput> {
    if (!input.signedTransaction) {
      throw new Error('Signed transaction must be provided')
    }

    const request: BroadcastRequestInput = {
      type: BeaconMessageType.BroadcastRequest,
      network: input.network || { type: NetworkType.MAINNET },
      signedTransaction: input.signedTransaction
    }

    const response = await this.makeRequest<BroadcastRequest, BroadcastResponse>(request).catch(
      async (requestError: Error) => {
        throw this.handleRequestError(request, requestError)
      }
    )

    await this.handleBeaconError(response.message)

    const { beaconId, transactionHash } = response.message

    return { beaconId, transactionHash }
  }

  private async handleRequestError(request: BeaconMessagesInput, error: Error): Promise<void> {
    console.error('requestError', error)
    this.events
      .emit(messageEvents[request.type].error)
      .catch((emitError) => console.warn(emitError))
    throw error
  }

  private async handleBeaconError(message: BeaconBaseMessage): Promise<void> {
    const errorMessage = message as BeaconErrorMessage
    if (errorMessage.errorType) {
      console.log('error', errorMessage.errorType)
      throw new Error(errorMessage.errorType)
    }
  }

  private async makeRequest<T extends BeaconMessagesInput, U extends BeaconMessages>(
    requestInput: Omit<T, IgnoredInputProperties>
  ): Promise<{
    message: U
    connectionInfo: ConnectionContext
  }> {
    logger.log('makeRequest')
    await this.init()
    await this.connect()
    logger.log('makeRequest', 'after connecting')

    if (await this.addRequestAndCheckIfRateLimited()) {
      this.events
        .emit(InternalEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch((emitError) => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    if (!(await this.checkPermissions(requestInput.type))) {
      this.events.emit(InternalEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError))

      throw new Error('No permissions to send this request to wallet!')
    }

    this.events
      .emit(messageEvents[requestInput.type].success)
      .catch((emitError) => console.warn(emitError))

    const payload = await new Serializer().serialize(requestInput)

    if (!this.beaconId) {
      throw new Error('BeaconID not defined')
    }

    const request: Omit<T, IgnoredInputProperties> & Pick<U, IgnoredInputProperties> = {
      id: generateGUID(),
      version: SDK_VERSION,
      beaconId: this.beaconId,
      ...requestInput
    }

    const exposed = exposedPromise<{ message: U; connectionInfo: ConnectionContext }>()
    this.addOpenRequest(request.id, exposed)

    if (!this.transport) {
      throw new Error('No transport')
    }
    await this.transport.send(payload)

    return exposed.promise
  }

  private async setActiveAccount(account?: AccountInfo): Promise<void> {
    if (!account) {
      return
    }

    this.activeAccount = account

    await this.storage.set(StorageKey.ACTIVE_ACCOUNT, account.accountIdentifier)

    await this.events.emit(InternalEvent.ACTIVE_ACCOUNT_SET, account)

    return
  }
}
