import { assertNever } from '../utils/assert-never'
import {
  ErrorResponse,
  BeaconMessage,
  BeaconResponseInputMessage,
  BeaconMessageType,
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse,
  PermissionInfo,
  AcknowledgeResponse,
  AppMetadata,
  EncryptPayloadResponse
} from '..'
import { PermissionManager } from '../managers/PermissionManager'
import { AppMetadataManager } from '../managers/AppMetadataManager'
import { BEACON_VERSION } from '../constants'
import { getAddressFromPublicKey } from '../utils/crypto'
import { getAccountIdentifier } from '../utils/get-account-identifier'
import { BeaconRequestMessage } from '../types/beacon/BeaconRequestMessage'
import { BeaconErrorType } from '../types/BeaconErrorType'
import { Logger } from '../utils/Logger'

interface OutgoingResponseInterceptorOptions {
  senderId: string
  request: BeaconRequestMessage
  message: BeaconResponseInputMessage
  ownAppMetadata: AppMetadata
  permissionManager: PermissionManager
  appMetadataManager: AppMetadataManager
  interceptorCallback(message: BeaconMessage): void
}

const logger = new Logger('OutgoingResponseInterceptor')

/**
 * @internalapi
 *
 * The OutgoingResponseInterceptor is used in the WalletClient to intercept an outgoing response and enrich it with data.
 */
export class OutgoingResponseInterceptor {
  public static async intercept(config: OutgoingResponseInterceptorOptions): Promise<void> {
    const {
      senderId,
      request,
      message,
      ownAppMetadata,
      permissionManager,
      appMetadataManager,
      interceptorCallback
    }: OutgoingResponseInterceptorOptions = config

    // TODO: Remove v1 compatibility in later version
    const interceptorCallbackWrapper = (msg: BeaconMessage): void => {
      const untypedMessage: any = msg
      untypedMessage.beaconId = msg.senderId
      interceptorCallback(msg)
    }

    switch (message.type) {
      case BeaconMessageType.Error: {
        const response: ErrorResponse = {
          type: message.type,
          version: BEACON_VERSION,
          senderId,
          id: message.id,
          errorType: message.errorType
        }
        if (message.errorType === BeaconErrorType.TRANSACTION_INVALID_ERROR && message.errorData) {
          const errorData = message.errorData
          // Check if error data is in correct format
          if (
            Array.isArray(errorData) &&
            errorData.every((item) => Boolean(item.kind) && Boolean(item.id))
          ) {
            response.errorData = message.errorData
          } else {
            logger.warn(
              'ErrorData provided is not in correct format. It needs to be an array of RPC errors. It will not be included in the message sent to the dApp'
            )
          }
        }
        interceptorCallbackWrapper(response)
        break
      }
      case BeaconMessageType.Acknowledge: {
        const response: AcknowledgeResponse = {
          type: message.type,
          version: BEACON_VERSION,
          senderId,
          id: message.id
        }
        interceptorCallbackWrapper(response)
        break
      }
      case BeaconMessageType.PermissionResponse: {
        const response: PermissionResponse = {
          senderId,
          version: BEACON_VERSION,
          appMetadata: ownAppMetadata,
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

        interceptorCallbackWrapper(response)
        break
      }
      case BeaconMessageType.OperationResponse:
        {
          const response: OperationResponse = {
            senderId,
            version: BEACON_VERSION,
            ...message
          }
          interceptorCallbackWrapper(response)
        }
        break
      case BeaconMessageType.SignPayloadResponse:
        {
          const response: SignPayloadResponse = {
            senderId,
            version: BEACON_VERSION,
            ...message
          }
          interceptorCallbackWrapper(response)
        }
        break
      case BeaconMessageType.EncryptPayloadResponse:
        {
          const response: EncryptPayloadResponse = {
            senderId,
            version: BEACON_VERSION,
            ...message
          }
          interceptorCallbackWrapper(response)
        }
        break
      case BeaconMessageType.BroadcastResponse:
        {
          const response: BroadcastResponse = {
            senderId,
            version: BEACON_VERSION,
            ...message
          }
          interceptorCallbackWrapper(response)
        }
        break

      default:
        logger.log('intercept', 'Message not handled')
        assertNever(message)
    }
  }
}
