import {
  BeaconErrorMessage,
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
import { BeaconRequestMessage } from '../types/beacon/BeaconRequestMessage'

interface OutgoingResponseInterceptorOptions {
  beaconId: string
  request: BeaconRequestMessage
  message: BeaconResponseInputMessage
  permissionManager: PermissionManager
  appMetadataManager: AppMetadataManager
  interceptorCallback(message: BeaconMessage): void
}

export class OutgoingResponseInterceptor {
  public static async intercept(config: OutgoingResponseInterceptorOptions): Promise<void> {
    const {
      beaconId,
      request,
      message,
      permissionManager,
      appMetadataManager,
      interceptorCallback
    }: OutgoingResponseInterceptorOptions = config

    switch (message.type) {
      case BeaconMessageType.Error: {
        const response: BeaconErrorMessage = {
          type: message.type,
          version: BEACON_VERSION,
          beaconId,
          id: message.id,
          errorType: message.errorType
        }
        interceptorCallback(response)
        break
      }
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
          connectedAt: new Date().getTime()
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
