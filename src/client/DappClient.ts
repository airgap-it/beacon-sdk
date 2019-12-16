import {
  BroadcastRequest,
  BroadcastResponse,
  Messages,
  MessageTypes,
  OperationRequest,
  OperationResponse,
  PermissionRequest,
  PermissionResponse,
  SignPayloadRequest,
  SignPayloadResponse
} from './Messages'
import myWindow from './MockWindow'
import { Serializer } from './Serializer'
import { ExposedPromise, exposedPromise } from './utils/exposed-promise'

interface Request {
  id: string
  promise: ExposedPromise<Messages>
}

export class DAppClient {
  private readonly name: string = ''
  private readonly serializer = new Serializer()
  private readonly listeners = new Map<MessageTypes, ((payload: any, callback: any) => void)[]>()
  private readonly openRequests = new Map<MessageTypes, Request[]>()

  constructor(name: string) {
    this.name = name
    myWindow.addEventListener('message', event => {
      const deserialized: { type: MessageTypes } = this.serializer.deserialize(event.data)
      const listeners = this.listeners.get(deserialized.type)
      if (listeners) {
        listeners.forEach(listener => {
          listener(deserialized, newPayload => {
            myWindow.postMessage(this.serializer.serialize(newPayload))
          })
        })
      } else {
        // throw new Error(`No listener defined for message type ${deserialized.type}`)
      }
    })

    const openRequestsHandler = (event: { id: string; type: MessageTypes }) => {
      const openRequests = this.openRequests.get(event.type) || []
      const openRequest = openRequests.find(openRequest => openRequest.id === event.id)
      if (openRequest) {
        console.log('found openRequest')
        openRequest.promise.resolve(event as any)
      } else {
        console.log(this.openRequests)
        // throw new Error('No matching request found')
      }
    }
    this.addListener(MessageTypes.PermissionResponse, openRequestsHandler)
    this.addListener(MessageTypes.SignPayloadResponse, openRequestsHandler)
    this.addListener(MessageTypes.OperationResponse, openRequestsHandler)
    this.addListener(MessageTypes.BroadcastResponse, openRequestsHandler)
  }

  public addListener(type: MessageTypes, listener: (payload: any, callback: any) => void) {
    const listeners = this.listeners.get(type) || []
    listeners.push(listener)
    this.listeners.set(type, listeners)
  }

  public addOpenRequest(type: MessageTypes, id: string, promise: ExposedPromise<Messages>) {
    console.log(this.name, 'adding request')
    const openRequests = this.openRequests.get(type) || []
    openRequests.push({ id, promise })
    this.openRequests.set(type, openRequests)
  }

  public async makeRequest<T extends Messages>(type: MessageTypes, request: Messages) {
    const payload = this.serializer.serialize(request)
    myWindow.postMessage(payload, '*')

    const exposed = exposedPromise<T>()
    this.addOpenRequest(type, (request as any).id, exposed)

    return exposed.promise
  }

  public async requestPermissions(request: PermissionRequest): Promise<PermissionResponse> {
    return this.makeRequest(MessageTypes.PermissionResponse, request)
  }

  public async signPayloads(request: SignPayloadRequest): Promise<SignPayloadResponse> {
    return this.makeRequest(MessageTypes.SignPayloadRequest, request)
  }

  public async requestOperation(request: OperationRequest): Promise<OperationResponse> {
    return this.makeRequest(MessageTypes.OperationRequest, request)
  }

  public async requestBroadcast(request: BroadcastRequest): Promise<BroadcastResponse> {
    return this.makeRequest(MessageTypes.BroadcastRequest, request)
  }
}
