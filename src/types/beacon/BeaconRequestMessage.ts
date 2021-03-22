import { PermissionRequest, OperationRequest, SignPayloadRequest, BroadcastRequest } from '../..'

/**
 * @internalapi
 */
export type BeaconRequestMessage =
  | PermissionRequest
  | OperationRequest
  | SignPayloadRequest
  | BroadcastRequest
