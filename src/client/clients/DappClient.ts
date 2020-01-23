import {
  BroadcastResponse,
  Messages,
  OperationResponse,
  PermissionResponse,
  SignPayloadResponse,
  BaseMessage,
  MessageTypes,
  PermissionScope
} from '../Messages'
import { ExposedPromise, exposedPromise } from '../utils/exposed-promise'

import { TezosOperation } from '../operations/OperationTypes'
import { Logger } from '../utils/Logger'
import { generateGUID } from '../utils/generate-uuid'
import { TransportType } from '../transports/Transport'
import { openToast } from '../alert/Toast'
import { BaseClient } from './Client'

const logger = new Logger('DAppClient')

export class DAppClient extends BaseClient {
  private readonly openRequests = new Map<string, ExposedPromise<Messages>>()

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
        openRequest.resolve(event as any)
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

  public async requestPermissions(request?: PermissionScope[]): Promise<PermissionResponse> {
    openToast({body: 'Permission request sent', timer: 3000}).catch(toastError => console.error(toastError))

    return this.makeRequest({
      id: '',
      name: this.name,
      type: MessageTypes.PermissionRequest,
      scope: request || ['read_address', 'sign', 'operation_request', 'threshold']
    })
  }

  public async signPayloads(request: {
    payload: Buffer[]
    sourceAddress: string
  }): Promise<SignPayloadResponse> {
    if (!request.payload) {
      throw new Error('Payload must be provided')
    }
    openToast({body: 'Signing request sent', timer: 3000}).catch(toastError => console.error(toastError))

    return this.makeRequest({
      id: '',
      type: MessageTypes.SignPayloadRequest,
      payload: request.payload,
      sourceAddress: request.sourceAddress || ''
    })
  }

  public async requestOperation(request: {
    network: string
    operationDetails: TezosOperation
  }): Promise<OperationResponse> {
    if (!request.operationDetails) {
      throw new Error('Operation details must be provided')
    }
    openToast({body: 'Operation request sent', timer: 3000}).catch(toastError => console.error(toastError))

    return this.makeRequest({
      id: '',
      type: MessageTypes.OperationRequest,
      network: request.network || 'mainnet',
      operationDetails: request.operationDetails
    })
  }

  public async requestBroadcast(request: {
    network: string
    signedTransaction: Buffer[]
  }): Promise<BroadcastResponse> {
    if (!request.signedTransaction) {
      throw new Error('Operation details must be provided')
    }
    openToast({body: 'Broadcast request sent', timer: 3000}).catch(toastError => console.error(toastError))

    return this.makeRequest({
      id: '',
      type: MessageTypes.BroadcastRequest,
      network: request.network || 'mainnet',
      signedTransaction: request.signedTransaction
    })
  }
}
