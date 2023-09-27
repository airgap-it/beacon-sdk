import {
  PermissionRequest,
  OperationRequest,
  SignPayloadRequest,
  BroadcastRequest,
  ProofOfEventChallengeRequest,
  ProofOfEventChallengeRecordedRequest
  // EncryptPayloadRequest
} from '@airgap/beacon-types'

/**
 * @internalapi
 */
export type BeaconRequestMessage =
  | PermissionRequest
  | OperationRequest
  | SignPayloadRequest
  // | EncryptPayloadRequest
  | BroadcastRequest
  | ProofOfEventChallengeRequest
  | ProofOfEventChallengeRecordedRequest
