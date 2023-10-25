import {
  PermissionRequest,
  OperationRequest,
  SignPayloadRequest,
  BroadcastRequest
  // EncryptPayloadRequest
} from '@mavrykdynamics/beacon-types'

/**
 * @internalapi
 */
export type BeaconRequestMessage =
  | PermissionRequest
  | OperationRequest
  | SignPayloadRequest
  // | EncryptPayloadRequest
  | BroadcastRequest
