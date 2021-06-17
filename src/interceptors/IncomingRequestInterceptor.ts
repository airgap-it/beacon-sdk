import { assertNever } from '../utils/assert-never'
import {
  BeaconRequestOutputMessage,
  BeaconMessageType,
  PermissionRequestOutput,
  AppMetadata,
  OperationRequestOutput,
  SignPayloadRequestOutput,
  BroadcastRequestOutput,
  EncryptPayloadRequestOutput
} from '..'
import { ConnectionContext } from '../types/ConnectionContext'
import { AppMetadataManager } from '../managers/AppMetadataManager'
import { BeaconRequestMessage } from '../types/beacon/BeaconRequestMessage'
import { Logger } from '../utils/Logger'

const logger = new Logger('IncomingRequestInterceptor')

interface IncomingRequestInterceptorOptions {
  message: BeaconRequestMessage
  connectionInfo: ConnectionContext
  appMetadataManager: AppMetadataManager
  interceptorCallback(message: BeaconRequestOutputMessage, connectionInfo: ConnectionContext): void
}

/**
 * @internalapi
 *
 * The IncomingRequestInterceptor is used in the WalletClient to intercept an incoming request and enrich it with data, like app metadata.
 */
export class IncomingRequestInterceptor {
  /**
   * The method that is called during the interception
   *
   * @param config
   */
  public static async intercept(config: IncomingRequestInterceptorOptions): Promise<void> {
    const {
      message,
      connectionInfo,
      appMetadataManager,
      interceptorCallback
    }: IncomingRequestInterceptorOptions = config

    // TODO: Remove v1 compatibility in later version
    if ((message as any).beaconId && !message.senderId) {
      message.senderId = (message as any).beaconId
      delete (message as any).beaconId
    }

    switch (message.type) {
      case BeaconMessageType.PermissionRequest:
        {
          // TODO: Remove v1 compatibility in later version
          if ((message.appMetadata as any).beaconId && !message.appMetadata.senderId) {
            message.appMetadata.senderId = (message.appMetadata as any).beaconId
            delete (message.appMetadata as any).beaconId
          }

          await appMetadataManager.addAppMetadata(message.appMetadata)
          const request: PermissionRequestOutput = message
          interceptorCallback(request, connectionInfo)
        }
        break
      case BeaconMessageType.OperationRequest:
        {
          const appMetadata: AppMetadata = await IncomingRequestInterceptor.getAppMetadata(
            appMetadataManager,
            message.senderId
          )
          const request: OperationRequestOutput = {
            appMetadata,
            ...message
          }
          interceptorCallback(request, connectionInfo)
        }
        break
      case BeaconMessageType.SignPayloadRequest:
        {
          const appMetadata: AppMetadata = await IncomingRequestInterceptor.getAppMetadata(
            appMetadataManager,
            message.senderId
          )
          const request: SignPayloadRequestOutput = {
            appMetadata,
            ...message
          }
          interceptorCallback(request, connectionInfo)
        }
        break
      case BeaconMessageType.EncryptPayloadRequest:
        {
          const appMetadata: AppMetadata = await IncomingRequestInterceptor.getAppMetadata(
            appMetadataManager,
            message.senderId
          )
          const request: EncryptPayloadRequestOutput = {
            appMetadata,
            ...message
          }
          interceptorCallback(request, connectionInfo)
        }
        break
      case BeaconMessageType.BroadcastRequest:
        {
          const appMetadata: AppMetadata = await IncomingRequestInterceptor.getAppMetadata(
            appMetadataManager,
            message.senderId
          )
          const request: BroadcastRequestOutput = {
            appMetadata,
            ...message
          }
          interceptorCallback(request, connectionInfo)
        }
        break

      default:
        logger.log('intercept', 'Message not handled')
        assertNever(message)
    }
  }

  private static async getAppMetadata(
    appMetadataManager: AppMetadataManager,
    senderId: string
  ): Promise<AppMetadata> {
    const appMetadata: AppMetadata | undefined = await appMetadataManager.getAppMetadata(senderId)
    if (!appMetadata) {
      throw new Error('AppMetadata not found')
    }

    return appMetadata
  }
}
