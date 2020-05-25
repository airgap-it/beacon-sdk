import {
  Serializer,
  Client,
  BeaconMessage,
  WalletClientOptions,
  LocalStorage,
  TransportType,
  BeaconRequestOutputMessage,
  BeaconResponseInputMessage,
  AppMetadata,
  PermissionInfo
} from '../..'
import { PermissionManager } from '../../managers/PermissionManager'
import { AppMetadataManager } from '../../managers/AppMetadataManager'
import { ConnectionContext } from '../../types/ConnectionContext'
import { IncomingBeaconMessageInterceptor } from '../../interceptors/IncomingBeaconMessageInterceptor'
import { OutgoingBeaconMessageInterceptor } from '../../interceptors/OutgoingBeaconMessageInterceptor'

export class WalletClient extends Client {
  private readonly permissionManager: PermissionManager
  private readonly appMetadataManager: AppMetadataManager

  private pendingRequests: BeaconMessage[] = []

  constructor(config: WalletClientOptions) {
    super({ name: config.name, storage: new LocalStorage() })
    this.permissionManager = new PermissionManager(new LocalStorage())
    this.appMetadataManager = new AppMetadataManager(new LocalStorage())
  }

  public async init(): Promise<TransportType> {
    return super.init(false)
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
        await IncomingBeaconMessageInterceptor.intercept({
          message,
          connectionInfo,
          appMetadataManager: this.appMetadataManager,
          interceptorCallback: newMessageCallback
        })
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

    await OutgoingBeaconMessageInterceptor.intercept({
      beaconId: await this.beaconId,
      request,
      message,
      permissionManager: this.permissionManager,
      appMetadataManager: this.appMetadataManager,
      interceptorCallback: async (response: BeaconMessage): Promise<void> => {
        await this.respondToMessage(response)
      }
    })
  }

  public async getAppMetadataList(): Promise<AppMetadata[]> {
    return this.appMetadataManager.getAppMetadataList()
  }

  public async getAppMetadata(beaconId: string): Promise<AppMetadata | undefined> {
    return this.appMetadataManager.getAppMetadata(beaconId)
  }

  public async removeAppMetadata(beaconId: string): Promise<void> {
    return this.appMetadataManager.removeAppMetadata(beaconId)
  }

  public async removeAllAppMetadata(): Promise<void> {
    return this.appMetadataManager.removeAllAppMetadata()
  }

  public async getPermissions(): Promise<PermissionInfo[]> {
    return this.permissionManager.getPermissions()
  }

  public async getPermission(accountIdentifier: string): Promise<PermissionInfo | undefined> {
    return this.permissionManager.getPermission(accountIdentifier)
  }

  public async removePermission(accountIdentifier: string): Promise<void> {
    return this.permissionManager.removePermission(accountIdentifier)
  }

  public async removeAllPermissions(): Promise<void> {
    return this.permissionManager.removeAllPermissions()
  }

  private async respondToMessage(message: BeaconMessage): Promise<void> {
    const serializedMessage: string = await new Serializer().serialize(message)
    await (await this.transport).send(serializedMessage)
  }
}
