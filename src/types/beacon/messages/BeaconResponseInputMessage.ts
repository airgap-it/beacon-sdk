import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse,
  BeaconErrorMessage
} from '../../..'

export type IgnoredResponseInputProperties = 'senderId' | 'version'

export type PermissionResponseInput = Omit<PermissionResponse, IgnoredResponseInputProperties>
export type OperationResponseInput = Omit<OperationResponse, IgnoredResponseInputProperties>
export type SignPayloadResponseInput = Omit<SignPayloadResponse, IgnoredResponseInputProperties>
export type BroadcastResponseInput = Omit<BroadcastResponse, IgnoredResponseInputProperties>
export type ErrorResponseInput = Omit<BeaconErrorMessage, IgnoredResponseInputProperties>

export type BeaconResponseInputMessage =
  | PermissionResponseInput
  | OperationResponseInput
  | SignPayloadResponseInput
  | BroadcastResponseInput
  | BeaconErrorMessage
