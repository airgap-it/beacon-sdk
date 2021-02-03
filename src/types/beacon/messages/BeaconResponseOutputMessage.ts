import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse,
  AccountInfo
} from '../../..'

export type IgnoredResponseOutputProperties = 'id' | 'version' | 'type'

export type PermissionResponseOutput = PermissionResponse & {
  address: string
  accountInfo: AccountInfo
}
export type OperationResponseOutput = OperationResponse
export type SignPayloadResponseOutput = SignPayloadResponse
export type BroadcastResponseOutput = BroadcastResponse

export type BeaconResponseOutputMessage =
  | PermissionResponseOutput
  | OperationResponseOutput
  | SignPayloadResponseOutput
  | BroadcastResponseOutput
