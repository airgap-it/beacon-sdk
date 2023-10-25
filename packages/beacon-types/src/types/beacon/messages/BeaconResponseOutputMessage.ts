import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  // EncryptPayloadResponse,
  BroadcastResponse,
  AccountInfo
} from '@mavrykdynamics/beacon-types'

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
  walletKey?: string | undefined // Last selected wallet key
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
// export type EncryptPayloadResponseOutput = EncryptPayloadResponse
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
  // | EncryptPayloadResponseOutput
  | BroadcastResponseOutput
