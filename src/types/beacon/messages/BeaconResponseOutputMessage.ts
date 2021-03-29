import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse,
  AccountInfo
} from '../../..'

/**
 * @category DApp
 */
export type IgnoredResponseOutputProperties = 'id' | 'version' | 'type'

/**
 * @category DApp
 */
export type PermissionResponseOutput = PermissionResponse & {
  address: string
  accountInfo: AccountInfo
}
/**
 * @category DApp
 */
export type OperationResponseOutput = OperationResponse
/**
 * @category DApp
 */
export type SignPayloadResponseOutput = SignPayloadResponse
/**
 * @category DApp
 */
export type BroadcastResponseOutput = BroadcastResponse

/**
 * @internalapi
 * @category DApp
 */
export type BeaconResponseOutputMessage =
  | PermissionResponseOutput
  | OperationResponseOutput
  | SignPayloadResponseOutput
  | BroadcastResponseOutput
