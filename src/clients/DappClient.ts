import {
  BroadcastResponse,
  Messages,
  OperationResponse,
  PermissionResponse,
  SignPayloadResponse,
  BaseMessage,
  MessageTypes,
  PermissionScope,
  BroadcastRequest,
  OperationRequest,
  SignPayloadRequest
} from '../messages/Messages'
import { ExposedPromise, exposedPromise } from '../utils/exposed-promise'

import { TezosOperation } from '../operations/OperationTypes'
import { Logger } from '../utils/Logger'
import { generateGUID } from '../utils/generate-uuid'
import { TransportType } from '../transports/Transport'
import { InternalEvent, InternalEventHandler } from '../events'
import { BaseClient } from './Client'

const logger = new Logger('DAppClient')

export class DAppClient extends BaseClient {
  private readonly events: InternalEventHandler = new InternalEventHandler()
  private readonly openRequests = new Map<string, ExposedPromise<Messages>>()
  private readonly permissions: Map<string, string[]> = new Map<string, string[]>()

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
    return super.init(true)
  }

  public async makeRequest<T extends Messages>(request: Messages): Promise<T> {
    logger.log('makeRequest')
    await this.init()
    await this.connect()
    logger.log('makeRequest', 'after connecting')

    request.id = generateGUID()
    const payload = this.serializer.serialize(request)

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

  public async checkPermissions(type: MessageTypes): Promise<boolean> {
    const permissions = this.permissions.get('')

    if (!permissions) {
      return false
    }

    switch (type) {
      case MessageTypes.OperationRequest:
        return permissions.some(permission => permission === 'operation_request')
      case MessageTypes.SignPayloadRequest:
        return permissions.some(permission => permission === 'sign')
      case MessageTypes.BroadcastRequest:
        return true
      default:
        return false
    }
  }

  public async requestPermissions(request?: PermissionScope[]): Promise<PermissionResponse> {
    this.events
      .emit(InternalEvent.PERMISSION_REQUEST_SENT)
      .catch(emitError => console.warn(emitError))

    return this.makeRequest<PermissionResponse>({
      id: '',
      name: this.name,
      type: MessageTypes.PermissionRequest,
      scope: request || ['read_address', 'sign', 'operation_request', 'threshold']
    })
      .catch(error => {
        console.log('error', error)
        throw new Error(error)
      })
      .then(async permissions => {
        this.permissions.set('', permissions.permissions.scopes)
        console.log('permissions interception', permissions)

        return permissions
      })
  }

  public async signPayloads(request: {
    payload: string[]
    sourceAddress: string
  }): Promise<SignPayloadResponse> {
    if (!request.payload) {
      throw new Error('Payload must be provided')
    }

    const req: SignPayloadRequest = {
      id: '',
      type: MessageTypes.SignPayloadRequest,
      payload: request.payload,
      sourceAddress: request.sourceAddress || ''
    }

    if (await this.checkPermissions(req.type)) {
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
    network: string
    operationDetails: TezosOperation[]
  }): Promise<OperationResponse> {
    if (!request.operationDetails) {
      throw new Error('Operation details must be provided')
    }

    const req: OperationRequest = {
      id: '',
      type: MessageTypes.OperationRequest,
      network: request.network || 'mainnet',
      operationDetails: request.operationDetails
    }

    if (await this.checkPermissions(req.type)) {
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
    network: string
    signedTransactions: string[]
  }): Promise<BroadcastResponse> {
    if (!request.signedTransactions) {
      throw new Error('Operation details must be provided')
    }

    const req: BroadcastRequest = {
      id: '',
      type: MessageTypes.BroadcastRequest,
      network: request.network || 'mainnet',
      signedTransactions: request.signedTransactions
    }

    if (await this.checkPermissions(req.type)) {
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
}
