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

export type BeaconMessages =
  | PermissionRequest
  | PermissionResponse
  | OperationRequest
  | OperationResponse
  | SignPayloadRequest
  | SignPayloadResponse
  | BroadcastRequest
  | BroadcastResponse
