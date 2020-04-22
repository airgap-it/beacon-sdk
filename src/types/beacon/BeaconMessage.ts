import {
  PermissionResponse,
  PermissionRequest,
  OperationRequest,
  OperationResponse,
  SignPayloadRequest,
  SignPayloadResponse,
  BroadcastRequest,
  BroadcastResponse
} from '../..'

export type BeaconMessage =
  | PermissionRequest
  | PermissionResponse
  | OperationRequest
  | OperationResponse
  | SignPayloadRequest
  | SignPayloadResponse
  | BroadcastRequest
  | BroadcastResponse
