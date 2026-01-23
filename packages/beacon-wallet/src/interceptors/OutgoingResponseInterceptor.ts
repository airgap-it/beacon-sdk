import {
  AppMetadataManager,
  getAccountIdentifier,
  Logger,
  PermissionManager,
  usesWrappedMessages
} from '@airgap/beacon-core'
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
  BeaconRequestMessage,
  BeaconErrorType,
  BeaconMessageWrapper,
  BlockchainResponseV3,
  PermissionResponseV3,
  BeaconBaseMessage,
  ProofOfEventChallengeResponse,
  SimulatedProofOfEventChallengeResponse,
  Blockchain,
  NetworkType
  // EncryptPayloadResponse
} from '@airgap/beacon-types'
import { getAddressFromPublicKey, CONTRACT_PREFIX, isValidAddress } from '@airgap/beacon-utils'

interface OutgoingResponseInterceptorOptions {
  senderId: string
  request: BeaconRequestMessage | BeaconMessageWrapper<BeaconBaseMessage>
  message: BeaconResponseInputMessage
  ownAppMetadata: AppMetadata
  permissionManager: PermissionManager
  appMetadataManager: AppMetadataManager
  interceptorCallback(message: BeaconMessage): void
  blockchains: Map<string, Blockchain>
}

const logger = new Logger('OutgoingResponseInterceptor')

/**
 * @internalapi
 *
 * The OutgoingResponseInterceptor is used in the WalletClient to intercept an outgoing response and enrich it with data.
 */
export class OutgoingResponseInterceptor {
  public static async intercept(config: OutgoingResponseInterceptorOptions): Promise<void> {
    if (config.request.version === '2') {
      OutgoingResponseInterceptor.handleV2Message(config)
    } else if (usesWrappedMessages(config.request.version)) {
      OutgoingResponseInterceptor.handleV3Message(config)
    }
  }

  private static async handleV3Message(config: OutgoingResponseInterceptorOptions) {
    const {
      senderId,
      request,
      message: msg,
      ownAppMetadata,
      permissionManager,
      appMetadataManager,
      interceptorCallback,
      blockchains
    }: OutgoingResponseInterceptorOptions = config

    const wrappedMessage:
      | BeaconMessageWrapper<PermissionResponseV3<string>>
      | BeaconMessageWrapper<BlockchainResponseV3<string>> = msg as any

    logger.log('WRAPPED MESSAGE', wrappedMessage)

    const v3Message: PermissionResponseV3<string> | BlockchainResponseV3<string> =
      wrappedMessage.message

    logger.log('LOGGING OUTGOING V3', v3Message, appMetadataManager)

    if (v3Message === undefined) {
      interceptorCallback(msg as any)
      return
    }

    const blockchain = blockchains.get(v3Message.blockchainIdentifier)
    if (blockchain === undefined) {
      throw new Error(`Blockchain "${v3Message.blockchainIdentifier}" not supported`)
    }

    switch (v3Message.type) {
      case BeaconMessageType.PermissionResponse:
        {
          const response: BeaconMessageWrapper<PermissionResponseV3<string>> = {
            id: wrappedMessage.id,
            version: request.version,
            senderId,
            message: {
              blockchainIdentifier: v3Message.blockchainIdentifier,
              type: BeaconMessageType.PermissionResponse,
              blockchainData: {
                ...(v3Message.blockchainData as any),
                appMetadata: ownAppMetadata
              }
            }
          }

          const appMetadata = await appMetadataManager.getAppMetadata(request.senderId)
          if (!appMetadata) {
            throw new Error('AppMetadata not found')
          }

          const accountInfos = await blockchain.getAccountInfosFromPermissionResponse(response.message)
          for (const accountInfo of accountInfos) {
            const permission: PermissionInfo = {
              accountIdentifier: accountInfo.accountId,
              senderId: request.senderId,
              appMetadata,
              website: '',
              address: accountInfo.address,
              publicKey: accountInfo.publicKey,
              network: accountInfo.network ?? { type: NetworkType.MAINNET },
              scopes: accountInfo.scopes,
              connectedAt: new Date().getTime()
            }

            permissionManager.addPermission(permission).catch(console.error)
          }

          interceptorCallback(response as any)
        }
        break
      case BeaconMessageType.BlockchainResponse:
        {
          // const appMetadata: AppMetadata = await IncomingRequestInterceptor.getAppMetadata(
          //   appMetadataManager,
          //   msg.senderId
          // )
          const response: BeaconMessageWrapper<BlockchainResponseV3<string>> = {
            id: wrappedMessage.id,
            version: request.version,
            senderId,
            message: {
              blockchainIdentifier: wrappedMessage.message.blockchainIdentifier,
              type: BeaconMessageType.BlockchainResponse,
              blockchainData: {
                ...(wrappedMessage.message.blockchainData as any)
              }
            }
          }
          interceptorCallback(response as any)
        }
        break

      default:
        logger.log('intercept', 'Message not handled')
        assertNever(v3Message)
    }
  }

  private static async handleV2Message(config: OutgoingResponseInterceptorOptions) {
    const {
      senderId,
      request,
      message,
      ownAppMetadata,
      permissionManager,
      appMetadataManager,
      interceptorCallback
    }: OutgoingResponseInterceptorOptions = config

    switch (message.type) {
      case BeaconMessageType.Error: {
        const response: ErrorResponse = {
          type: message.type,
          version: '2',
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
        interceptorCallback(response)
        break
      }
      case BeaconMessageType.Acknowledge: {
        const response: AcknowledgeResponse = {
          type: message.type,
          version: '2',
          senderId,
          id: message.id
        }
        interceptorCallback(response)
        break
      }
      case BeaconMessageType.PermissionResponse: {
        const response: PermissionResponse = {
          senderId,
          version: '2',
          appMetadata: ownAppMetadata,
          ...message
        }

        if (!response.address && !response.publicKey) {
          throw new Error('Address or PublicKey must be defined')
        }

        const publicKey = response.publicKey

        const address: string = response.address ?? (await getAddressFromPublicKey(publicKey!))

        if (!isValidAddress(address)) {
          throw new Error(`Invalid address: "${address}"`)
        }

        if (
          message.walletType === 'abstracted_account' &&
          address.substring(0, 3) !== CONTRACT_PREFIX
        ) {
          throw new Error(
            `Invalid abstracted account address "${address}", it should be a ${CONTRACT_PREFIX} address`
          )
        }

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
            version: '2',
            ...message
          }
          interceptorCallback(response)
        }
        break
      case BeaconMessageType.SignPayloadResponse:
        {
          const response: SignPayloadResponse = {
            senderId,
            version: '2',
            ...message
          }
          interceptorCallback(response)
        }
        break
      // TODO: ENCRYPTION
      // case BeaconMessageType.EncryptPayloadResponse:
      //   {
      //     const response: EncryptPayloadResponse = {
      //       senderId,
      //       version: BEACON_VERSION,
      //       ...message
      //     }
      //     interceptorCallback(response)
      //   }
      //   break
      case BeaconMessageType.BroadcastResponse:
        {
          const response: BroadcastResponse = {
            senderId,
            version: '2',
            ...message
          }
          interceptorCallback(response)
        }
        break
      case BeaconMessageType.ProofOfEventChallengeResponse:
        {
          const response: ProofOfEventChallengeResponse = {
            senderId,
            version: '2',
            ...message
          }
          interceptorCallback(response)
        }
        break
      case BeaconMessageType.SimulatedProofOfEventChallengeResponse:
        {
          const response: SimulatedProofOfEventChallengeResponse = {
            senderId,
            version: '2',
            ...message
          }
          interceptorCallback(response)
        }
        break
      default:
        logger.log('intercept', 'Message not handled')
        assertNever(message)
    }
  }
}
function assertNever(_message: never) {
  throw new Error('Function not implemented.')
}
