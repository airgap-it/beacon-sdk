import { Optional } from '@mavrykdynamics/beacon-types'
import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  // EncryptPayloadResponse,
  BroadcastResponse,
  AcknowledgeResponse,
  ErrorResponse
} from '@mavrykdynamics/beacon-types'

/**
 * @category Wallet
 */
export type IgnoredResponseInputProperties = 'senderId' | 'version'

/**
 * @category Wallet
 */
export type PermissionResponseInput = Optional<
  PermissionResponse,
  IgnoredResponseInputProperties | 'appMetadata'
>
/**
 * @category Wallet
 */
export type OperationResponseInput = Optional<OperationResponse, IgnoredResponseInputProperties>
/**
 * @category Wallet
 */
export type SignPayloadResponseInput = Optional<SignPayloadResponse, IgnoredResponseInputProperties>
/**
 * @category Wallet
 */
// export type EncryptPayloadResponseInput = Optional<
//   EncryptPayloadResponse,
//   IgnoredResponseInputProperties
// >
/**
 * @category Wallet
 */
export type BroadcastResponseInput = Optional<BroadcastResponse, IgnoredResponseInputProperties>
/**
 * @category Wallet
 */
export type AcknowledgeResponseInput = Optional<AcknowledgeResponse, IgnoredResponseInputProperties>
/**
 * @category Wallet
 */
export type ErrorResponseInput = Optional<ErrorResponse, IgnoredResponseInputProperties>

/**
 * @internalapi
 * @category Wallet
 */
export type BeaconResponseInputMessage =
  | PermissionResponseInput
  | OperationResponseInput
  | SignPayloadResponseInput
  // | EncryptPayloadResponseInput
  | BroadcastResponseInput
  | AcknowledgeResponseInput
  | ErrorResponseInput
