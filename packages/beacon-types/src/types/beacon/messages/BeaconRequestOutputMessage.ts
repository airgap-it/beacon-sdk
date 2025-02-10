import {
  Optional,
  ProofOfEventChallengeRequest,
  SimulatedProofOfEventChallengeRequest
} from '@airgap/beacon-types'
import {
  AppMetadata,
  PermissionRequest,
  OperationRequest,
  SignPayloadRequest,
  // EncryptPayloadRequest,
  BroadcastRequest
} from '@airgap/beacon-types'

/**
 * @category Wallet
 */
export type IgnoredRequestOutputProperties = 'version'

/**
 * @category Wallet
 */
export interface ExtraResponseOutputProperties {
  appMetadata: AppMetadata
}

/**
 * @category Wallet
 */
export type PermissionRequestOutput = Optional<PermissionRequest, IgnoredRequestOutputProperties> &
  ExtraResponseOutputProperties
/**
 * @category Wallet
 */
export type ProofOfEventChallengeRequestOutput = Optional<
  ProofOfEventChallengeRequest,
  IgnoredRequestOutputProperties
> &
  ExtraResponseOutputProperties
/**
 * @category Wallet
 */
export type SimulatedProofOfEventChallengeRequestOutput = Optional<
  SimulatedProofOfEventChallengeRequest,
  IgnoredRequestOutputProperties
> &
  ExtraResponseOutputProperties
/**
 * @category Wallet
 */
export type OperationRequestOutput = Optional<OperationRequest, IgnoredRequestOutputProperties> &
  ExtraResponseOutputProperties
/**
 * @category Wallet
 */
export type SignPayloadRequestOutput = Optional<
  SignPayloadRequest,
  IgnoredRequestOutputProperties
> &
  ExtraResponseOutputProperties
/**
 * @category Wallet
 */
// export type EncryptPayloadRequestOutput = Optional<
//   EncryptPayloadRequest,
//   IgnoredRequestOutputProperties
// > &
//   ExtraResponseOutputProperties
/**
 * @category Wallet
 */
export type BroadcastRequestOutput = Optional<BroadcastRequest, IgnoredRequestOutputProperties> &
  ExtraResponseOutputProperties

/**
 * @internalapi
 * @category Wallet
 */
export type BeaconRequestOutputMessage =
  | PermissionRequestOutput
  | OperationRequestOutput
  | SignPayloadRequestOutput
  // | EncryptPayloadRequestOutput
  | BroadcastRequestOutput
  | ProofOfEventChallengeRequestOutput
  | SimulatedProofOfEventChallengeRequestOutput
