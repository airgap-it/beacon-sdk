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
import { Serializer } from '../Serializer'
import { ExposedPromise, exposedPromise } from '../utils/exposed-promise'
import { ExtensionTransport } from '../transports/ExtensionTransport'
import { P2PTransport } from '../transports/P2PTransport'
import { Transport } from '../transports/Transport'
import { TezosOperation } from '../operations/OperationTypes'
import { Logger } from '../utils/Logger'

const logger = new Logger('DAppClient')

export class DAppClient {
  private readonly name: string = ''
  private readonly serializer = new Serializer()
  private readonly openRequests = new Map<string, ExposedPromise<Messages>>()

  private transport: Transport | undefined

  constructor(name: string) {
    this.name = name
  }

  public handleResponse(event: BaseMessage): void {
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

  public addOpenRequest(id: string, promise: ExposedPromise<Messages>): void {
    logger.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`)
    this.openRequests.set(id, promise)
  }

  public async makeRequest<T extends Messages>(request: Messages): Promise<T> {
    request.id = Math.random().toString()
    const payload = this.serializer.serialize(request)

    const exposed = exposedPromise<T>()
    this.addOpenRequest(request.id, exposed)

    if (!this.transport) {
      throw new Error('No transport')
    }
    await this.transport.send(payload)

    return exposed.promise
  }

  public async init(transport?: Transport): Promise<void> {
    if (transport) {
      this.transport = transport // Let users define their own transport
    } else if (await ExtensionTransport.isAvailable()) {
      this.transport = new ExtensionTransport() // Talk to extension first and relay everything
    } else if (await P2PTransport.isAvailable()) {
      this.transport = new P2PTransport() // Establish our own connection with the wallet
    }
    await this.connect()
  }

  public async requestPermissions(request?: PermissionScope[]): Promise<PermissionResponse> {
    return this.makeRequest({
      id: '',
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

    return this.makeRequest({
      id: '',
      type: MessageTypes.BroadcastRequest,
      network: request.network || 'mainnet',
      signedTransaction: request.signedTransaction
    })
  }

  private async connect(): Promise<void> {
    if (this.transport) {
      await this.transport.connect()
      this.transport
        .addListener((message: string) => {
          const deserializedMessage = this.serializer.deserialize(message) as BaseMessage // TODO: Check type
          this.handleResponse(deserializedMessage)
        })
        .catch(error => console.log(error))
    } else {
      throw new Error('no transport available')
    }
  }
}
