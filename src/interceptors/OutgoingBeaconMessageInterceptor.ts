import {
  BeaconMessage,
  BeaconResponseInputMessage,
  BeaconMessageType,
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse,
  PermissionInfo
} from '..'
import { PermissionManager } from '../managers/PermissionManager'
import { AppMetadataManager } from '../managers/AppMetadataManager'
import { BEACON_VERSION } from '../constants'
import { getAddressFromPublicKey } from '../utils/crypto'
import { getAccountIdentifier } from '../utils/get-account-identifier'

interface OutgoingBeaconMessageInterceptorOptions {
  beaconId: string
  request: BeaconMessage
  message: BeaconResponseInputMessage
  permissionManager: PermissionManager
  appMetadataManager: AppMetadataManager
  interceptorCallback(message: BeaconMessage): void
}

export class OutgoingBeaconMessageInterceptor {
  public static async intercept(config: OutgoingBeaconMessageInterceptorOptions): Promise<void> {
    const {
      beaconId,
      request,
      message,
      permissionManager,
      appMetadataManager,
      interceptorCallback
    }: OutgoingBeaconMessageInterceptorOptions = config

    switch (message.type) {
      case BeaconMessageType.PermissionResponse: {
        const response: PermissionResponse = {
          beaconId,
          version: BEACON_VERSION,
          ...message
        }

        // TODO: Migration code. Remove before 1.0.0 release.
        const publicKey = response.publicKey || (response as any).pubkey || (response as any).pubKey

        const address: string = await getAddressFromPublicKey(publicKey)
        const appMetadata = await appMetadataManager.getAppMetadata(request.beaconId)
        if (!appMetadata) {
          throw new Error('AppMetadata not found')
        }

        const permission: PermissionInfo = {
          accountIdentifier: await getAccountIdentifier(address, response.network),
          beaconId: request.beaconId,
          appMetadata,
          website: '',
          address,
          publicKey,
          network: response.network,
          scopes: response.scopes,
          connectedAt: new Date()
        }

        permissionManager.addPermission(permission).catch(console.error)

        interceptorCallback(response)
        break
      }
      case BeaconMessageType.OperationResponse:
        {
          const response: OperationResponse = {
            beaconId,
            version: BEACON_VERSION,
            ...message
          }
          interceptorCallback(response)
        }
        break
      case BeaconMessageType.SignPayloadResponse:
        {
          const response: SignPayloadResponse = {
            beaconId,
            version: BEACON_VERSION,
            ...message
          }
          interceptorCallback(response)
        }
        break
      case BeaconMessageType.BroadcastResponse:
        {
          const response: BroadcastResponse = {
            beaconId,
            version: BEACON_VERSION,
            ...message
          }
          interceptorCallback(response)
        }
        break

      default:
        console.log('Message not handled')
    }
  }
}
