import {
  BeaconRequestOutputMessage,
  BeaconMessageType,
  PermissionRequestOutput,
  AppMetadata,
  OperationRequestOutput,
  SignPayloadRequestOutput,
  BroadcastRequestOutput,
  ConnectionContext,
  BeaconRequestMessage

  // EncryptPayloadRequestOutput
} from '@airgap/beacon-types'
import { AppMetadataManager, Logger } from '@airgap/beacon-core'
import {
  BeaconMessageWrapper,
  BlockchainRequestV3,
  PermissionRequestV3
} from './beacon-messages-new'

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
    console.log('INTERCEPTING REQUEST', config.message)

    if (config.message.version === '2') {
      IncomingRequestInterceptor.handleV2Message(config)
    } else if (config.message.version === '3') {
      IncomingRequestInterceptor.handleV3Message(config)
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

  private static async handleV2Message(config: IncomingRequestInterceptorOptions) {
    const {
      message,
      connectionInfo,
      appMetadataManager,
      interceptorCallback
    }: IncomingRequestInterceptorOptions = config

    switch (message.type) {
      case BeaconMessageType.PermissionRequest:
        {
          console.log('PERMISSION REQUEST V*', message)
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
      // TODO: ENCRYPTION
      // case BeaconMessageType.EncryptPayloadRequest:
      //   {
      //     const appMetadata: AppMetadata = await IncomingRequestInterceptor.getAppMetadata(
      //       appMetadataManager,
      //       message.senderId
      //     )
      //     const request: EncryptPayloadRequestOutput = {
      //       appMetadata,
      //       ...message
      //     }
      //     interceptorCallback(request, connectionInfo)
      //   }
      //   break
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

  private static async handleV3Message(config: IncomingRequestInterceptorOptions) {
    const {
      message: msg,
      connectionInfo,
      appMetadataManager,
      interceptorCallback
    }: IncomingRequestInterceptorOptions = config

    const wrappedMessage:
      | BeaconMessageWrapper<PermissionRequestV3<string>>
      | BeaconMessageWrapper<BlockchainRequestV3<string>> = msg as any

    const v3Message: PermissionRequestV3<string> | BlockchainRequestV3<string> =
      wrappedMessage.message

    console.log('LOGGING V3', v3Message, connectionInfo, appMetadataManager)

    switch (v3Message.type) {
      case BeaconMessageType.PermissionRequest:
        {
          await appMetadataManager.addAppMetadata({
            ...v3Message.blockchainData.appMetadata,
            senderId: msg.senderId
          }) // Make sure we use the actual senderId, not what the dApp told us
          const request: any /* PermissionRequestOutput */ = wrappedMessage
          interceptorCallback(request, connectionInfo)
        }
        break
      case BeaconMessageType.BlockchainRequest:
        {
          // const appMetadata: AppMetadata = await IncomingRequestInterceptor.getAppMetadata(
          //   appMetadataManager,
          //   msg.senderId
          // )
          const request: any /* BeaconMessageWrapper<BlockchainRequestV3<string>> */ = {
            ...wrappedMessage
          }
          interceptorCallback(request, connectionInfo)
        }
        break

      default:
        logger.log('intercept', 'Message not handled')
        assertNever(v3Message)
    }
  }
}
function assertNever(_message: never) {
  throw new Error('Function not implemented.')
}
