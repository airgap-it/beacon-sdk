import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse,
  AcknowledgeResponse,
  ErrorResponse
} from '../../..'

/**
 * @category Wallet
 */
export type IgnoredResponseInputProperties = 'senderId' | 'version' | 'appMetadata'

/**
 * @category Wallet
 */
export type PermissionResponseInput = Omit<PermissionResponse, IgnoredResponseInputProperties>
/**
 * @category Wallet
 */
export type OperationResponseInput = Omit<OperationResponse, IgnoredResponseInputProperties>
/**
 * @category Wallet
 */
export type SignPayloadResponseInput = Omit<SignPayloadResponse, IgnoredResponseInputProperties>
/**
 * @category Wallet
 */
export type BroadcastResponseInput = Omit<BroadcastResponse, IgnoredResponseInputProperties>
/**
 * @category Wallet
 */
export type AcknowledgeResponseInput = Omit<AcknowledgeResponse, IgnoredResponseInputProperties>
/**
 * @category Wallet
 */
export type ErrorResponseInput = Omit<ErrorResponse, IgnoredResponseInputProperties>

/**
 * @internalapi
 * @category Wallet
 */
export type BeaconResponseInputMessage =
  | PermissionResponseInput
  | OperationResponseInput
  | SignPayloadResponseInput
  | BroadcastResponseInput
  | AcknowledgeResponseInput
  | ErrorResponseInput
