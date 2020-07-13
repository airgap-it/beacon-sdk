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
  PermissionInfo,
  P2PTransport,
  P2PPairingRequest
} from '../..'
import { PermissionManager } from '../../managers/PermissionManager'
import { AppMetadataManager } from '../../managers/AppMetadataManager'
import { ConnectionContext } from '../../types/ConnectionContext'
import { IncomingRequestInterceptor } from '../../interceptors/IncomingRequestInterceptor'
import { OutgoingResponseInterceptor } from '../../interceptors/OutgoingResponseInterceptor'
import { BeaconRequestMessage } from '../../types/beacon/BeaconRequestMessage'

export class WalletClient extends Client {
  private readonly permissionManager: PermissionManager
  private readonly appMetadataManager: AppMetadataManager

  private pendingRequests: BeaconRequestMessage[] = []

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
      message: BeaconRequestMessage,
      connectionInfo: ConnectionContext
    ): Promise<void> => {
      if (!this.pendingRequests.some((request) => request.id === message.id)) {
        this.pendingRequests.push(message)
        await IncomingRequestInterceptor.intercept({
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

    await OutgoingResponseInterceptor.intercept({
      senderId: await this.beaconId,
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

  public async removePeer(id: P2PPairingRequest): Promise<void> {
    if ((await this.transport).type === TransportType.P2P) {
      const removePeerResult = ((await this.transport) as P2PTransport).removePeer(id)

      await this.removePermissionsForPeers([id])

      return removePeerResult
    }
  }

  public async removeAllPeers(): Promise<void> {
    if ((await this.transport).type === TransportType.P2P) {
      const peers: P2PPairingRequest[] = await ((await this.transport) as P2PTransport).getPeers()
      const removePeerResult = ((await this.transport) as P2PTransport).removeAllPeers()

      await this.removePermissionsForPeers(peers)

      return removePeerResult
    }
  }

  private async removePermissionsForPeers(peersToRemove: P2PPairingRequest[]): Promise<void> {
    const permissions = await this.permissionManager.getPermissions()

    const peerIdsToRemove = peersToRemove.map((peer) => peer.publicKey)
    // Remove all permissions with origin of the specified peer
    const permissionsToRemove = permissions.filter((permission) =>
      peerIdsToRemove.includes(permission.appMetadata.senderId)
    )
    const permissionIdentifiersToRemove = permissionsToRemove.map(
      (permissionInfo) => permissionInfo.accountIdentifier
    )
    await this.permissionManager.removePermissions(permissionIdentifiersToRemove)
  }

  private async respondToMessage(message: BeaconMessage): Promise<void> {
    const serializedMessage: string = await new Serializer().serialize(message)
    await (await this.transport).send(serializedMessage)
  }
}
