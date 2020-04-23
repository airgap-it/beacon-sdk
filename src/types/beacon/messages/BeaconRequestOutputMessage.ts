import {
  AppMetadata,
  PermissionRequest,
  OperationRequest,
  SignPayloadRequest,
  BroadcastRequest
} from '../../..'

export type IgnoredRequestOutputProperties = 'version'

export interface ExtraResponseOutputProperties {
  appMetadata: AppMetadata
}

export type PermissionRequestOutput = Omit<PermissionRequest, IgnoredRequestOutputProperties> &
  ExtraResponseOutputProperties
export type OperationRequestOutput = Omit<OperationRequest, IgnoredRequestOutputProperties> &
  ExtraResponseOutputProperties
export type SignPayloadRequestOutput = Omit<SignPayloadRequest, IgnoredRequestOutputProperties> &
  ExtraResponseOutputProperties
export type BroadcastRequestOutput = Omit<BroadcastRequest, IgnoredRequestOutputProperties> &
  ExtraResponseOutputProperties

export type BeaconRequestOutputMessage =
  | PermissionRequestOutput
  | OperationRequestOutput
  | SignPayloadRequestOutput
  | BroadcastRequestOutput
