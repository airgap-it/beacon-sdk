import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse
} from '../../..'

export type IgnoredResponseOutputProperties = 'id' | 'version' | 'type'

export type PermissionResponseOutput = Omit<
  Omit<PermissionResponse, IgnoredResponseOutputProperties>,
  'publicKey'
> & { address: string }
export type OperationResponseOutput = Omit<OperationResponse, IgnoredResponseOutputProperties>
export type SignPayloadResponseOutput = Omit<SignPayloadResponse, IgnoredResponseOutputProperties>
export type BroadcastResponseOutput = Omit<BroadcastResponse, IgnoredResponseOutputProperties>

export type BeaconResponseOutputMessage =
  | PermissionResponseOutput
  | OperationResponseOutput
  | SignPayloadResponseOutput
  | BroadcastResponseOutput
