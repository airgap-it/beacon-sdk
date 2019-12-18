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
import { myWindow } from './MockWindow'
import { Serializer } from './Serializer'
import { ExposedPromise, exposedPromise } from './utils/exposed-promise'

interface BeaconEvent { id: string; type: MessageTypes }

interface Request {
  id: string
  promise: ExposedPromise<Messages>
}

export class DAppClient {
  private readonly name: string = ''
  private readonly serializer = new Serializer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly listeners = new Map<MessageTypes, ((payload: any, callback: any) => void)[]>()
  private readonly openRequests = new Map<MessageTypes, Request[]>()

  constructor(name: string) {
    this.name = name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    myWindow.addEventListener('message', (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deserialized: { type: MessageTypes } = this.serializer.deserialize(event.data) as any
      const listeners = this.listeners.get(deserialized.type)
      if (listeners) {
        listeners.forEach(listener => {
          listener(deserialized, newPayload => {
            myWindow.postMessage(this.serializer.serialize(newPayload))
          })
        })
      } else {
        // Throw new Error(`No listener defined for message type ${deserialized.type}`)
      }
    })

    const openRequestsHandler = (event: BeaconEvent): void => {
      const openRequests = this.openRequests.get(event.type) || []
      const openRequest = openRequests.find(openRequestElement => openRequestElement.id === event.id)
      if (openRequest) {
        console.log('found openRequest')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        openRequest.promise.resolve(event as any)
      } else {
        console.log(this.openRequests)
        // Throw new Error('No matching request found')
      }
    }
    this.addListener(MessageTypes.PermissionResponse, openRequestsHandler)
    this.addListener(MessageTypes.SignPayloadResponse, openRequestsHandler)
    this.addListener(MessageTypes.OperationResponse, openRequestsHandler)
    this.addListener(MessageTypes.BroadcastResponse, openRequestsHandler)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addListener(type: MessageTypes, listener: (payload: any, callback: any) => void): void {
    const listeners = this.listeners.get(type) || []
    listeners.push(listener)
    this.listeners.set(type, listeners)
  }

  public addOpenRequest(type: MessageTypes, id: string, promise: ExposedPromise<Messages>): void {
    console.log(this.name, 'adding request')
    const openRequests = this.openRequests.get(type) || []
    openRequests.push({ id, promise })
    this.openRequests.set(type, openRequests)
  }

  public async makeRequest<T extends Messages>(type: MessageTypes, request: Messages): Promise<T> {
    const payload = this.serializer.serialize(request)
    myWindow.postMessage(payload, '*')

    const exposed = exposedPromise<T>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
