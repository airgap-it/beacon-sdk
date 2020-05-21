import {
  BeaconMessage,
  BeaconRequestOutputMessage,
  BeaconMessageType,
  PermissionRequestOutput,
  AppMetadata,
  OperationRequestOutput,
  SignPayloadRequestOutput,
  BroadcastRequestOutput
} from '..'
import { ConnectionContext } from '../types/ConnectionContext'
import { AppMetadataManager } from '../managers/AppMetadataManager'

interface IncomingBeaconMessageInterceptorOptions {
  message: BeaconMessage
  connectionInfo: ConnectionContext
  appMetadataManager: AppMetadataManager
  interceptorCallback(message: BeaconRequestOutputMessage, connectionInfo: ConnectionContext): void
}

export class IncomingBeaconMessageInterceptor {
  public static async intercept(config: IncomingBeaconMessageInterceptorOptions): Promise<void> {
    const {
      message,
      connectionInfo,
      appMetadataManager,
      interceptorCallback
    }: IncomingBeaconMessageInterceptorOptions = config

    switch (message.type) {
      case BeaconMessageType.PermissionRequest:
        {
          await appMetadataManager.addAppMetadata(message.appMetadata)
          const request: PermissionRequestOutput = message
          interceptorCallback(request, connectionInfo)
        }
        break
      case BeaconMessageType.OperationRequest:
        {
          const appMetadata: AppMetadata = await IncomingBeaconMessageInterceptor.getAppMetadata(
            appMetadataManager,
            message.beaconId
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
          const appMetadata: AppMetadata = await IncomingBeaconMessageInterceptor.getAppMetadata(
            appMetadataManager,
            message.beaconId
          )
          const request: SignPayloadRequestOutput = {
            appMetadata,
            ...message
          }
          interceptorCallback(request, connectionInfo)
        }
        break
      case BeaconMessageType.BroadcastRequest:
        {
          const appMetadata: AppMetadata = await IncomingBeaconMessageInterceptor.getAppMetadata(
            appMetadataManager,
            message.beaconId
          )
          const request: BroadcastRequestOutput = {
            appMetadata,
            ...message
          }
          interceptorCallback(request, connectionInfo)
        }
        break

      default:
        console.log('Message not handled')
    }
  }

  private static async getAppMetadata(
    appMetadataManager: AppMetadataManager,
    beaconId: string
  ): Promise<AppMetadata> {
    const appMetadata: AppMetadata | undefined = await appMetadataManager.getAppMetadata(beaconId)
    if (!appMetadata) {
      throw new Error('AppMetadata not found')
    }

    return appMetadata
  }
}
