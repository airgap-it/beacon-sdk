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
  TransportStatus,
  WalletP2PTransport
} from '../..'
import { PermissionManager } from '../../managers/PermissionManager'
import { AppMetadataManager } from '../../managers/AppMetadataManager'
import { ConnectionContext } from '../../types/ConnectionContext'
import { IncomingRequestInterceptor } from '../../interceptors/IncomingRequestInterceptor'
import { OutgoingResponseInterceptor } from '../../interceptors/OutgoingResponseInterceptor'
import { BeaconRequestMessage } from '../../types/beacon/BeaconRequestMessage'
import { BeaconMessageType } from '../../types/beacon/BeaconMessageType'
import { AcknowledgeResponseInput } from '../../types/beacon/messages/BeaconResponseInputMessage'
import { getSenderId } from '../../utils/get-sender-id'
import { ExtendedP2PPairingResponse } from '../../types/P2PPairingResponse'
import { ExposedPromise } from '../../utils/exposed-promise'

/**
 * The WalletClient has to be used in the wallet. It handles all the logic related to connecting to beacon-compatible
 * dapps and handling/responding to requests.
 */
export class WalletClient extends Client {
  /**
   * Returns whether or not the transport is connected
   */
  protected readonly _isConnected: ExposedPromise<boolean> = new ExposedPromise()
  public get isConnected(): Promise<boolean> {
    return this._isConnected.promise
  }

  private readonly permissionManager: PermissionManager
  private readonly appMetadataManager: AppMetadataManager

  /**
   * This array stores pending requests, meaning requests we received and have not yet handled / sent a response.
   */
  private pendingRequests: BeaconRequestMessage[] = []

  constructor(config: WalletClientOptions) {
    super({ storage: new LocalStorage(), ...config })
    this.permissionManager = new PermissionManager(new LocalStorage())
    this.appMetadataManager = new AppMetadataManager(new LocalStorage())
  }

  public async init(): Promise<TransportType> {
    const keyPair = await this.keyPair // We wait for keypair here so the P2P Transport creation is not delayed and causing issues

    const p2pTransport = new WalletP2PTransport(this.name, keyPair, this.storage, this.matrixNodes)

    return super.init(p2pTransport)
  }

  /**
   * This method initiates a connection to the P2P network and registers a callback that will be called
   * whenever a message is received.
   *
   * @param newMessageCallback The callback that will be invoked for every message the transport receives.
   */
  public async connect(
    newMessageCallback: (
      message: BeaconRequestOutputMessage,
      connectionInfo: ConnectionContext
    ) => void
  ): Promise<void> {
    this.handleResponse = async (
      message: BeaconRequestMessage,
      connectionInfo: ConnectionContext
    ): Promise<void> => {
      if (!this.pendingRequests.some((request) => request.id === message.id)) {
        this.pendingRequests.push(message)

        await this.sendAcknowledgeResponse(message)

        await IncomingRequestInterceptor.intercept({
          message,
          connectionInfo,
          appMetadataManager: this.appMetadataManager,
          interceptorCallback: newMessageCallback
        })
      }
    }

    return this._connect()
  }

  /**
   * The method will attempt to initiate a connection using the active transport.
   */
  public async _connect(): Promise<void> {
    const transport: WalletP2PTransport = (await this.transport) as WalletP2PTransport
    if (transport.connectionStatus === TransportStatus.NOT_CONNECTED) {
      await transport.connect()
      transport
        .addListener(async (message: unknown, connectionInfo: ConnectionContext) => {
          if (typeof message === 'string') {
            const deserializedMessage = (await new Serializer().deserialize(
              message
            )) as BeaconRequestMessage
            this.handleResponse(deserializedMessage, connectionInfo)
          }
        })
        .catch((error) => console.log(error))
      this._isConnected.resolve(true)
    } else {
      // NO-OP
    }
  }

  /**
   * This method sends a response for a specific request back to the DApp
   *
   * @param message The BeaconResponseMessage that will be sent back to the DApp
   */
  public async respond(message: BeaconResponseInputMessage): Promise<void> {
    const request = this.pendingRequests.find((pendingRequest) => pendingRequest.id === message.id)
    if (!request) {
      throw new Error('No matching request found!')
    }

    this.pendingRequests = this.pendingRequests.filter(
      (pendingRequest) => pendingRequest.id !== message.id
    )

    await OutgoingResponseInterceptor.intercept({
      senderId: await getSenderId(await this.beaconId),
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

  public async getAppMetadata(senderId: string): Promise<AppMetadata | undefined> {
    return this.appMetadataManager.getAppMetadata(senderId)
  }

  public async removeAppMetadata(senderId: string): Promise<void> {
    return this.appMetadataManager.removeAppMetadata(senderId)
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

  public async removePeer(peer: ExtendedP2PPairingResponse): Promise<void> {
    const removePeerResult = (await this.transport).removePeer(peer)

    await this.removePermissionsForPeers([peer])

    return removePeerResult
  }

  public async removeAllPeers(): Promise<void> {
    const peers: ExtendedP2PPairingResponse[] = await (await this.transport).getPeers()
    const removePeerResult = (await this.transport).removeAllPeers()

    await this.removePermissionsForPeers(peers)

    return removePeerResult
  }

  private async removePermissionsForPeers(
    peersToRemove: ExtendedP2PPairingResponse[]
  ): Promise<void> {
    const permissions = await this.permissionManager.getPermissions()

    const peerIdsToRemove = peersToRemove.map((peer) => peer.senderId)
    // Remove all permissions with origin of the specified peer
    const permissionsToRemove = permissions.filter((permission) =>
      peerIdsToRemove.includes(permission.appMetadata.senderId)
    )
    const permissionIdentifiersToRemove = permissionsToRemove.map(
      (permissionInfo) => permissionInfo.accountIdentifier
    )
    await this.permissionManager.removePermissions(permissionIdentifiersToRemove)
  }

  /**
   * Send an acknowledge message back to the sender
   *
   * @param message The message that was received
   */
  private async sendAcknowledgeResponse(request: BeaconRequestMessage): Promise<void> {
    // Acknowledge the message
    const acknowledgeResponse: AcknowledgeResponseInput = {
      id: request.id,
      type: BeaconMessageType.Acknowledge
    }

    await OutgoingResponseInterceptor.intercept({
      senderId: await getSenderId(await this.beaconId),
      request,
      message: acknowledgeResponse,
      permissionManager: this.permissionManager,
      appMetadataManager: this.appMetadataManager,
      interceptorCallback: async (response: BeaconMessage): Promise<void> => {
        await this.respondToMessage(response)
      }
    })
  }

  /**
   * An internal method to send a BeaconMessage to the DApp
   *
   * @param response Send a message back to the DApp
   */
  private async respondToMessage(response: BeaconMessage): Promise<void> {
    const serializedMessage: string = await new Serializer().serialize(response)
    await (await this.transport).send(serializedMessage)
  }
}
