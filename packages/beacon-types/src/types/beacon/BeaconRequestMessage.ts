import {
  PermissionRequest,
  OperationRequest,
  SignPayloadRequest,
  BroadcastRequest
  // EncryptPayloadRequest
} from '@airgap/beacon-types'

/**
 * @internalapi
 */
export type BeaconRequestMessage =
  | PermissionRequest
  | OperationRequest
  | SignPayloadRequest
  // | EncryptPayloadRequest
  | BroadcastRequest
