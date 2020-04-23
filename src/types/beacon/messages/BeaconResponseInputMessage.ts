import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse
} from '../../..'

export type IgnoredResponseInputProperties = 'beaconId' | 'version'

export type PermissionResponseInput = Omit<PermissionResponse, IgnoredResponseInputProperties>
export type OperationResponseInput = Omit<OperationResponse, IgnoredResponseInputProperties>
export type SignPayloadResponseInput = Omit<SignPayloadResponse, IgnoredResponseInputProperties>
export type BroadcastResponseInput = Omit<BroadcastResponse, IgnoredResponseInputProperties>

export type BeaconResponseInputMessage =
  | PermissionResponseInput
  | OperationResponseInput
  | SignPayloadResponseInput
  | BroadcastResponseInput
