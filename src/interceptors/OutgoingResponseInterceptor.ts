import {
  ErrorResponse,
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
  senderId: string
  request: BeaconRequestMessage
  message: BeaconResponseInputMessage
  permissionManager: PermissionManager
  appMetadataManager: AppMetadataManager
  interceptorCallback(message: BeaconMessage): void
}

export class OutgoingResponseInterceptor {
  public static async intercept(config: OutgoingResponseInterceptorOptions): Promise<void> {
    const {
      senderId,
      request,
      message,
      permissionManager,
      appMetadataManager,
      interceptorCallback
    }: OutgoingResponseInterceptorOptions = config

    switch (message.type) {
      case BeaconMessageType.Error: {
        const response: ErrorResponse = {
          type: message.type,
          version: BEACON_VERSION,
          senderId,
          id: message.id,
          errorType: message.errorType
        }
        interceptorCallback(response)
        break
      }
      case BeaconMessageType.PermissionResponse: {
        const response: PermissionResponse = {
          senderId,
          version: BEACON_VERSION,
          ...message
        }

        // TODO: Migration code. Remove sometime after 1.0.0 release.
        const publicKey = response.publicKey || (response as any).pubkey || (response as any).pubKey

        const address: string = await getAddressFromPublicKey(publicKey)
        const appMetadata = await appMetadataManager.getAppMetadata(request.senderId)
        if (!appMetadata) {
          throw new Error('AppMetadata not found')
        }

        const permission: PermissionInfo = {
          accountIdentifier: await getAccountIdentifier(address, response.network),
          senderId: request.senderId,
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
            senderId,
            version: BEACON_VERSION,
            ...message
          }
          interceptorCallback(response)
        }
        break
      case BeaconMessageType.SignPayloadResponse:
        {
          const response: SignPayloadResponse = {
            senderId,
            version: BEACON_VERSION,
            ...message
          }
          interceptorCallback(response)
        }
        break
      case BeaconMessageType.BroadcastResponse:
        {
          const response: BroadcastResponse = {
            senderId,
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
