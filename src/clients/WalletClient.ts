import { ConnectionContext } from '../types/ConnectionContext'
import { SDK_VERSION } from '../constants'
import {
  BaseClient,
  BeaconBaseMessage,
  TransportType,
  PermissionRequest,
  OperationRequest,
  SignPayloadRequest,
  BroadcastRequest,
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse,
  AppMetadata,
  BeaconMessageType,
  BeaconMessage,
  Origin,
  PermissionScope,
  Serializer,
  LocalStorage
} from '..'

type IgnoredResponseOutputProperties = 'version'

interface ExtraResponseOutputProperties {
  appMetadata: AppMetadata
}

export type PermissionRequestOutput = Omit<PermissionRequest, IgnoredResponseOutputProperties> &
  ExtraResponseOutputProperties
export type OperationRequestOutput = Omit<OperationRequest, IgnoredResponseOutputProperties> &
  ExtraResponseOutputProperties
export type SignPayloadRequestOutput = Omit<SignPayloadRequest, IgnoredResponseOutputProperties> &
  ExtraResponseOutputProperties
export type BroadcastRequestOutput = Omit<BroadcastRequest, IgnoredResponseOutputProperties> &
  ExtraResponseOutputProperties

export type BeaconRequestOutputMessage =
  | PermissionRequestOutput
  | OperationRequestOutput
  | SignPayloadRequestOutput
  | BroadcastRequestOutput

export type IgnoredResponseInputProperties = 'beaconId' | 'version'

export type PermissionResponseInput = Omit<PermissionResponse, IgnoredResponseInputProperties>
export type OperationResponseInput = Omit<OperationResponse, IgnoredResponseInputProperties>
export type SignPayloadResponseInput = Omit<SignPayloadResponse, IgnoredResponseInputProperties>
export type BroadcastResponseInput = Omit<BroadcastResponse, IgnoredResponseInputProperties>

export type BeaconResponseInputMessage =
  | PermissionResponseInput
  | OperationResponseInput
  | SignPayloadResponseInput
  | BroadcastResponseInput

export class WalletClient extends BaseClient {
  private pendingRequests: BeaconBaseMessage[] = []

  constructor(config: { name: string }) {
    super({ name: config.name, storage: new LocalStorage() })
  }

  public async init(): Promise<TransportType> {
    return super.init(false)
  }

  public async getAppMetadata(
    beaconId: string
  ): Promise<{ appMetadata: AppMetadata; connectionContext: ConnectionContext }> {
    console.log(beaconId)

    return {
      appMetadata: {
        beaconId: 'placeholder_from_sdk',
        name: 'placeholder_from_sdk'
      },
      connectionContext: { origin: Origin.EXTENSION, id: 'placeholder_from_sdk' }
    }
  }

  public async saveAppMetadata(
    message: PermissionRequest,
    connectionInfo: ConnectionContext
  ): Promise<void> {
    console.log(message, connectionInfo)
  }

  // public async getPermission(_beaconId: string) {}

  // public async savePermission() {}

  public async checkPermissions(
    type: BeaconMessageType,
    permissions: PermissionScope[]
  ): Promise<boolean> {
    switch (type) {
      case BeaconMessageType.OperationRequest:
        return permissions.some((permission) => permission === PermissionScope.OPERATION_REQUEST)
      case BeaconMessageType.SignPayloadRequest:
        return permissions.some((permission) => permission === PermissionScope.SIGN)
      case BeaconMessageType.PermissionRequest:
      case BeaconMessageType.BroadcastRequest:
        return true
      default:
        return false
    }
  }

  public async connect(
    newMessageCallback: (
      message: BeaconRequestOutputMessage,
      connectionInfo: ConnectionContext
    ) => void
  ): Promise<boolean> {
    this.handleResponse = async (
      message: BeaconMessage,
      connectionInfo: ConnectionContext
    ): Promise<void> => {
      if (!this.pendingRequests.some((request) => request.id === message.id)) {
        this.pendingRequests.push(message)
        console.log('PUSHING NEW REQUEST', message, connectionInfo)
        switch (message.type) {
          case BeaconMessageType.PermissionRequest:
            {
              await this.saveAppMetadata(message, connectionInfo)
              const request: PermissionRequestOutput = message
              newMessageCallback(request, connectionInfo)
            }
            break
          case BeaconMessageType.OperationRequest:
            {
              const appMetadata = await this.getAppMetadata(message.beaconId)
              const request: OperationRequestOutput = {
                appMetadata: appMetadata.appMetadata,
                ...message
              }
              newMessageCallback(request, connectionInfo)
            }
            break
          case BeaconMessageType.SignPayloadRequest:
            {
              const appMetadata = await this.getAppMetadata(message.beaconId)
              const request: SignPayloadRequestOutput = {
                appMetadata: appMetadata.appMetadata,
                ...message
              }
              newMessageCallback(request, connectionInfo)
            }
            break
          case BeaconMessageType.BroadcastRequest:
            {
              const appMetadata = await this.getAppMetadata(message.beaconId)
              const request: BroadcastRequestOutput = {
                appMetadata: appMetadata.appMetadata,
                ...message
              }
              newMessageCallback(request, connectionInfo)
            }
            break

          default:
            console.log('Message not handled')
        }
      }
    }

    return super._connect()
  }

  public async respond(message: BeaconResponseInputMessage): Promise<void> {
    console.log('responding to message', message)
    const request = this.pendingRequests.find((pendingRequest) => pendingRequest.id === message.id)
    if (!request) {
      throw new Error('No matching request found!')
    }

    this.pendingRequests = this.pendingRequests.filter(
      (pendingRequest) => pendingRequest.id !== message.id
    )

    const beaconId = this.beaconId ? this.beaconId : ''
    const version = SDK_VERSION
    switch (message.type) {
      case BeaconMessageType.PermissionResponse: {
        const response: PermissionResponse = {
          beaconId,
          version,
          ...message
        }
        // this.savePermission(response.)
        await this.respondToMessage(response)
        break
      }
      case BeaconMessageType.OperationResponse:
        {
          const response: OperationResponse = {
            beaconId,
            version,
            ...message
          }
          await this.respondToMessage(response)
        }
        break
      case BeaconMessageType.SignPayloadResponse:
        {
          const response: SignPayloadResponse = {
            beaconId,
            version,
            ...message
          }
          await this.respondToMessage(response)
        }
        break
      case BeaconMessageType.BroadcastResponse:
        {
          const response: BroadcastResponse = {
            beaconId,
            version,
            ...message
          }
          await this.respondToMessage(response)
        }
        break

      default:
        console.log('Message not handled')
    }
  }

  private async respondToMessage(message: BeaconMessage): Promise<void> {
    if (!this.transport) {
      throw new Error('no transport defined')
    }
    const serializedMessage: string = await new Serializer().serialize(message)
    await this.transport.send(serializedMessage)
  }
}
