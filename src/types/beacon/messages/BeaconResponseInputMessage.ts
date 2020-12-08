import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse,
  AcknowledgeResponse,
  ErrorResponse
} from '../../..'

export type IgnoredResponseInputProperties = 'senderId' | 'version'

export type PermissionResponseInput = Omit<PermissionResponse, IgnoredResponseInputProperties>
export type OperationResponseInput = Omit<OperationResponse, IgnoredResponseInputProperties>
export type SignPayloadResponseInput = Omit<SignPayloadResponse, IgnoredResponseInputProperties>
export type BroadcastResponseInput = Omit<BroadcastResponse, IgnoredResponseInputProperties>
export type AcknowledgeResponseInput = Omit<AcknowledgeResponse, IgnoredResponseInputProperties>
export type ErrorResponseInput = Omit<ErrorResponse, IgnoredResponseInputProperties>

export type BeaconResponseInputMessage =
  | PermissionResponseInput
  | OperationResponseInput
  | SignPayloadResponseInput
  | BroadcastResponseInput
  | AcknowledgeResponseInput
  | ErrorResponseInput
