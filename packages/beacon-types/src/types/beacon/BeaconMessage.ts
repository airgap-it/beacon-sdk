import {
  PermissionResponse,
  PermissionRequest,
  OperationRequest,
  OperationResponse,
  SignPayloadRequest,
  SignPayloadResponse,
  // EncryptPayloadRequest,
  // EncryptPayloadResponse,
  BroadcastRequest,
  BroadcastResponse,
  AcknowledgeResponse,
  DisconnectMessage,
  ErrorResponse,
  ProofOfEventChallengeRequest,
  ProofOfEventChallengeResponse,
  SimulatedProofOfEventChallengeRequest,
  SimulatedProofOfEventChallengeResponse,
  ChangeAccountRequest
} from '@airgap/beacon-types'

/**
 * @internalapi
 */
export type BeaconMessage =
  | PermissionRequest
  | PermissionResponse
  | ProofOfEventChallengeRequest
  | ProofOfEventChallengeResponse
  | SimulatedProofOfEventChallengeRequest
  | SimulatedProofOfEventChallengeResponse
  | OperationRequest
  | OperationResponse
  | SignPayloadRequest
  | SignPayloadResponse
  // | EncryptPayloadRequest
  // | EncryptPayloadResponse
  | BroadcastRequest
  | BroadcastResponse
  | AcknowledgeResponse
  | DisconnectMessage
  | ErrorResponse
  | ChangeAccountRequest
