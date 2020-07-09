import { PermissionRequest, OperationRequest, SignPayloadRequest, BroadcastRequest } from '../../..'

export type IgnoredRequestInputProperties = 'id' | 'senderId' | 'version'

export type PermissionRequestInput = Omit<PermissionRequest, IgnoredRequestInputProperties>
export type OperationRequestInput = Omit<OperationRequest, IgnoredRequestInputProperties>
export type SignPayloadRequestInput = Omit<SignPayloadRequest, IgnoredRequestInputProperties>
export type BroadcastRequestInput = Omit<BroadcastRequest, IgnoredRequestInputProperties>

export type BeaconRequestInputMessage =
  | PermissionRequestInput
  | OperationRequestInput
  | SignPayloadRequestInput
  | BroadcastRequestInput
