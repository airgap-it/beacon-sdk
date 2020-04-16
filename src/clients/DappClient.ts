import {
  BroadcastResponse,
  Messages,
  OperationResponse,
  PermissionResponse,
  SignPayloadResponse,
  BaseMessage,
  MessageType,
  PermissionScope,
  BroadcastRequest,
  OperationRequest,
  SignPayloadRequest,
  Network,
  NetworkType
} from '../types/Messages'
import { ExposedPromise, exposedPromise } from '../utils/exposed-promise'

import { TezosOperation } from '../operations/OperationTypes'
import { Logger } from '../utils/Logger'
import { generateGUID } from '../utils/generate-uuid'
import { TransportType } from '../transports/Transport'
import { InternalEvent, InternalEventHandler } from '../events'
import { StorageKey } from '../storage/Storage'
import { BeaconError } from '../types/Errors'
import { AccountInfo, AccountIdentifier, Origin } from '../types/AccountInfo'
import { BaseClient } from './Client'

const logger = new Logger('DAppClient')

export class DAppClient extends BaseClient {
  private readonly events: InternalEventHandler = new InternalEventHandler()
  private readonly openRequests = new Map<string, ExposedPromise<Messages>>()
  private activeAccount: AccountInfo | undefined

  public get isConnected(): Promise<boolean> {
    return this._isConnected.promise
  }

  constructor(name: string) {
    super(name)

    this.handleResponse = (event: BaseMessage): void => {
      const openRequest = this.openRequests.get(event.id)
      if (openRequest) {
        logger.log('handleResponse', 'found openRequest', event.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((event as any).error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          openRequest.reject(event as any)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          openRequest.resolve(event as any)
        }
        this.openRequests.delete(event.id)
      } else {
        logger.error('handleResponse', 'no request found for id ', event.id)
      }
    }
  }

  public addOpenRequest(id: string, promise: ExposedPromise<Messages>): void {
    logger.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`)
    this.openRequests.set(id, promise)
  }

  public async init(): Promise<TransportType> {
    const initResponse = await super.init(true)
    if (!this.storage) {
      throw new Error('Storage not defined after init!')
    }

    this.storage
      .get(StorageKey.ACTIVE_ACCOUNT)
      .then(async activeAccount => {
        if (activeAccount) {
          await this.setActiveAccount(await this.getAccount(activeAccount))
        }
      })
      .catch(storageError => {
        console.error(storageError)
      })

    return initResponse
  }

  public async getActiveAccount(): Promise<AccountInfo | undefined> {
    return this.activeAccount
  }

  public async makeRequest<T extends Messages>(request: Messages): Promise<T> {
    logger.log('makeRequest')
    await this.init()
    await this.connect()
    logger.log('makeRequest', 'after connecting')

    const payload = await this.serializer.serialize(request)

    const exposed = exposedPromise<T>()
    this.addOpenRequest(request.id, exposed)

    if (!this.transport) {
      throw new Error('No transport')
    }
    await this.transport.send(payload, {})

    return exposed.promise
  }

  public async connect(): Promise<boolean> {
    return super._connect()
  }

  public async checkPermissions(
    type: MessageType,
    identifier: AccountIdentifier
  ): Promise<boolean> {
    const accountInfo = await this.getAccount(identifier)

    if (!accountInfo) {
      return false
    }

    switch (type) {
      case MessageType.OperationRequest:
        return accountInfo.scopes.some(
          permission => permission === PermissionScope.OPERATION_REQUEST
        )
      case MessageType.SignPayloadRequest:
        return accountInfo.scopes.some(permission => permission === PermissionScope.SIGN)
      case MessageType.BroadcastRequest:
        return true
      default:
        return false
    }
  }

  public async requestPermissions(request?: {
    network?: Network
    scopes?: PermissionScope[]
  }): Promise<PermissionResponse> {
    if (!this.beaconId) {
      throw new Error('BeaconID not defined')
    }

    if (await this.addRequestAndCheckIfRateLimited()) {
      this.events
        .emit(InternalEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch(emitError => console.warn(emitError))

      throw new Error('rate limit reached')
    }
    this.events
      .emit(InternalEvent.PERMISSION_REQUEST_SENT)
      .catch(emitError => console.warn(emitError))

    return this.makeRequest<PermissionResponse>({
      id: generateGUID(),
      beaconId: this.beaconId,
      appMetadata: {
        name: this.name
      },
      type: MessageType.PermissionRequest,
      network: request && request.network ? request.network : { type: NetworkType.MAINNET },
      scopes:
        request && request.scopes
          ? request.scopes
          : [PermissionScope.READ_ADDRESS, PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN]
    })
      .catch(error => {
        console.log('error', error)
        throw new Error(error)
      })
      .then(async response => {
        if (((response as any) as BeaconError).errorType) {
          console.log('error', ((response as any) as BeaconError).errorType)
          throw new Error(((response as any) as BeaconError).errorType)
        }

        const accountInfo = {
          accountIdentifier: response.accountIdentifier,
          beaconId: response.beaconId,
          origin: {
            type: Origin.P2P, // TODO: Extension or BeaconP2P
            id: response.beaconId
          },
          pubkey: response.pubkey,
          network: response.network,
          scopes: response.scopes,
          connectedAt: new Date()
        }
        this.activeAccount = accountInfo
        await this.addAccount(accountInfo)
        console.log('permissions interception', response)

        return response
      })
  }

  public async signPayloads(request: {
    payload: string
    sourceAddress: string
  }): Promise<SignPayloadResponse> {
    if (!this.beaconId) {
      throw new Error('BeaconID not defined')
    }
    if (!request.payload) {
      throw new Error('Payload must be provided')
    }
    if (!this.activeAccount) {
      throw new Error('No account is active')
    }
    if (await this.addRequestAndCheckIfRateLimited()) {
      this.events
        .emit(InternalEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch(emitError => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    const req: SignPayloadRequest = {
      id: generateGUID(),
      beaconId: this.beaconId,
      type: MessageType.SignPayloadRequest,
      payload: request.payload,
      sourceAddress: request.sourceAddress || ''
    }

    if (await this.checkPermissions(req.type, this.activeAccount.accountIdentifier)) {
      this.events.emit(InternalEvent.SIGN_REQUEST_SENT).catch(emitError => console.warn(emitError))

      this.events
        .emit(InternalEvent.OPERATION_REQUEST_SENT)
        .catch(emitError => console.warn(emitError))

      return this.makeRequest<SignPayloadResponse>(req).catch(error => {
        console.log('error', error)
        throw new Error(error)
      })
    } else {
      this.events.emit(InternalEvent.SIGN_REQUEST_ERROR).catch(emitError => console.warn(emitError))

      throw new Error('No permissions to send this request to wallet!')
    }
  }

  public async requestOperation(request: {
    network?: Network
    operationDetails: TezosOperation[]
  }): Promise<OperationResponse> {
    if (!this.beaconId) {
      throw new Error('BeaconID not defined')
    }
    if (!request.operationDetails) {
      throw new Error('Operation details must be provided')
    }
    if (!this.activeAccount) {
      throw new Error('No account is active')
    }
    if (await this.addRequestAndCheckIfRateLimited()) {
      this.events
        .emit(InternalEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch(emitError => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    const req: OperationRequest = {
      id: generateGUID(),
      beaconId: this.beaconId,
      type: MessageType.OperationRequest,
      network: request.network || { type: NetworkType.MAINNET },
      operationDetails: request.operationDetails
    }

    if (await this.checkPermissions(req.type, this.activeAccount.accountIdentifier)) {
      this.events
        .emit(InternalEvent.OPERATION_REQUEST_SENT)
        .catch(emitError => console.warn(emitError))

      return this.makeRequest<OperationResponse>(req).catch(error => {
        console.log('error', error)
        throw new Error(error)
      })
    } else {
      this.events
        .emit(InternalEvent.OPERATION_REQUEST_ERROR)
        .catch(emitError => console.warn(emitError))

      throw new Error('No permissions to send this request to wallet!')
    }
  }

  public async requestBroadcast(request: {
    network?: Network
    signedTransaction: string
  }): Promise<BroadcastResponse> {
    if (!this.beaconId) {
      throw new Error('BeaconID not defined')
    }
    if (!request.signedTransaction) {
      throw new Error('Signed transaction must be provided')
    }
    if (!this.activeAccount) {
      throw new Error('No account is active')
    }
    if (await this.addRequestAndCheckIfRateLimited()) {
      this.events
        .emit(InternalEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch(emitError => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    const req: BroadcastRequest = {
      id: generateGUID(),
      beaconId: this.beaconId,
      type: MessageType.BroadcastRequest,
      network: request.network || { type: NetworkType.MAINNET },
      signedTransaction: request.signedTransaction
    }

    if (await this.checkPermissions(req.type, this.activeAccount.accountIdentifier)) {
      this.events
        .emit(InternalEvent.BROADCAST_REQUEST_SENT)
        .catch(emitError => console.warn(emitError))

      return this.makeRequest<BroadcastResponse>(req).catch(error => {
        console.log('error', error)
        throw new Error(error)
      })
    } else {
      this.events
        .emit(InternalEvent.BROADCAST_REQUEST_ERROR)
        .catch(emitError => console.warn(emitError))

      throw new Error('No permissions to send this request to wallet!')
    }
  }

  private async setActiveAccount(account?: AccountInfo): Promise<void> {
    if (!account) {
      return
    }
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    this.activeAccount = account

    return this.storage.set(StorageKey.ACTIVE_ACCOUNT, account.accountIdentifier)
  }
}
