import { Optional } from '@mavrykdynamics/beacon-types'
import {
  PermissionRequest,
  OperationRequest,
  SignPayloadRequest,
  // EncryptPayloadRequest,
  BroadcastRequest
} from '@mavrykdynamics/beacon-types'

/**
 * @internalapi
 * @category DApp
 */
export type IgnoredRequestInputProperties = 'id' | 'senderId' | 'version'

/**
 * @internalapi
 * @category DApp
 */
export type PermissionRequestInput = Optional<PermissionRequest, IgnoredRequestInputProperties>
/**
 * @internalapi
 * @category DApp
 */
export type OperationRequestInput = Optional<OperationRequest, IgnoredRequestInputProperties>
/**
 * @internalapi
 * @category DApp
 */
export type SignPayloadRequestInput = Optional<SignPayloadRequest, IgnoredRequestInputProperties>
/**
 * @internalapi
 * @category DApp
 */
// export type EncryptPayloadRequestInput = Optional<
//   EncryptPayloadRequest,
//   IgnoredRequestInputProperties
// >
/**
 * @internalapi
 * @category DApp
 */
export type BroadcastRequestInput = Optional<BroadcastRequest, IgnoredRequestInputProperties>

/**
 * @internalapi
 * @category DApp
 */
export type BeaconRequestInputMessage =
  | PermissionRequestInput
  | OperationRequestInput
  // | EncryptPayloadRequestInput
  | SignPayloadRequestInput
  | BroadcastRequestInput
