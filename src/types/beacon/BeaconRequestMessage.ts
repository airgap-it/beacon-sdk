import { PermissionRequest, OperationRequest, SignPayloadRequest, BroadcastRequest } from '../..'

export type BeaconRequestMessage =
  | PermissionRequest
  | OperationRequest
  | SignPayloadRequest
  | BroadcastRequest
