/**
 * General docs
 * @module public
 */
import { AppMetadata } from './types/beacon/AppMetadata'
import { PermissionRequest } from './types/beacon/messages/PermissionRequest'
import { Network } from './types/beacon/Network'
import { BeaconBaseMessage } from './types/beacon/BeaconBaseMessage'
import { BeaconMessageType } from './types/beacon/BeaconMessageType'
import { PermissionScope } from './types/beacon/PermissionScope'
import { PermissionResponse } from './types/beacon/messages/PermissionResponse'
import { OperationRequest } from './types/beacon/messages/OperationRequest'
import { OperationResponse } from './types/beacon/messages/OperationResponse'
import { SignPayloadRequest } from './types/beacon/messages/SignPayloadRequest'
import { SignPayloadResponse } from './types/beacon/messages/SignPayloadResponse'
import { BroadcastRequest } from './types/beacon/messages/BroadcastRequest'
import { BroadcastResponse } from './types/beacon/messages/BroadcastResponse'
import { NetworkType } from './types/beacon/NetworkType'
import { TezosBaseOperation } from './types/tezos/TezosBaseOperation'
import { TezosOperationType } from './types/tezos/OperationTypes'
import { TezosActivateAccountOperation } from './types/tezos/operations/ActivateAccount'
import { TezosBallotOperation } from './types/tezos/operations/Ballot'
import { TezosDelegationOperation } from './types/tezos/operations/Delegation'
import { TezosDoubleBakingEvidenceOperation } from './types/tezos/operations/DoubleBakingEvidence'
import { TezosBlockHeader } from './types/tezos/TezosBlockHeader'
import { TezosDoubleEndorsementEvidenceOperation } from './types/tezos/operations/DoubleEndorsementEvidence'
import { TezosEndorsementOperation } from './types/tezos/operations/Endorsement'
import { TezosOriginationOperation } from './types/tezos/operations/Origination'
import { TezosProposalOperation } from './types/tezos/operations/Proposal'
import { TezosRevealOperation } from './types/tezos/operations/Reveal'
import { TezosSeedNonceRevelationOperation } from './types/tezos/operations/SeedNonceRevelation'
import { TezosTransactionOperation } from './types/tezos/operations/Transaction'
import { MichelsonPrimitives } from './types/tezos/MichelsonPrimitives'
import { TezosTransactionParameters } from './types/tezos/TezosTransactionParameters'
import { Origin } from './types/Origin'
import { AccountInfo, AccountIdentifier } from './types/AccountInfo'
import { EncryptedExtensionMessage, ExtensionMessage } from './types/ExtensionMessage'
import { ExtensionMessageTarget } from './types/ExtensionMessageTarget'
import { TezosOperation } from './types/tezos/TezosOperation'
import { BeaconErrorType } from './types/BeaconErrorType'
import { ErrorResponse } from './types/beacon/messages/ErrorResponse'
import { TransportStatus } from './types/transport/TransportStatus'
import { TransportType } from './types/transport/TransportType'
import { Storage } from './types/storage/Storage'
import { StorageKey } from './types/storage/StorageKey'
import { defaultValues, StorageKeyReturnDefaults } from './types/storage/StorageKeyReturnDefaults'
import { StorageKeyReturnType } from './types/storage/StorageKeyReturnType'
import { ExtendedP2PPairingRequest, P2PPairingRequest } from './types/P2PPairingRequest'
import { BeaconMessage } from './types/beacon/BeaconMessage'
import { RequestPermissionInput } from './types/RequestPermissionInput'
import { RequestSignPayloadInput } from './types/RequestSignPayloadInput'
// import { RequestEncryptPayloadInput } from './types/RequestEncryptPayloadInput'
import { RequestOperationInput } from './types/RequestOperationInput'
import { RequestBroadcastInput } from './types/RequestBroadcastInput'
import {
  PermissionResponseInput,
  SignPayloadResponseInput,
  // EncryptPayloadResponseInput,
  OperationResponseInput,
  BroadcastResponseInput,
  BeaconResponseInputMessage,
  AcknowledgeResponseInput,
  ErrorResponseInput
} from './types/beacon/messages/BeaconResponseInputMessage'
import {
  PermissionResponseOutput,
  SignPayloadResponseOutput,
  // EncryptPayloadResponseOutput,
  OperationResponseOutput,
  BroadcastResponseOutput,
  BeaconResponseOutputMessage
} from './types/beacon/messages/BeaconResponseOutputMessage'
import {
  PermissionRequestInput,
  SignPayloadRequestInput,
  // EncryptPayloadRequestInput,
  OperationRequestInput,
  BroadcastRequestInput,
  BeaconRequestInputMessage,
  IgnoredRequestInputProperties
} from './types/beacon/messages/BeaconRequestInputMessage'
import {
  PermissionRequestOutput,
  SignPayloadRequestOutput,
  // EncryptPayloadRequestOutput,
  OperationRequestOutput,
  BroadcastRequestOutput,
  BeaconRequestOutputMessage
} from './types/beacon/messages/BeaconRequestOutputMessage'
import { PermissionInfo } from './types/PermissionInfo'
import { ConnectionContext } from './types/ConnectionContext'
import { Threshold } from './types/beacon/Threshold'
import {
  PartialTezosTransactionOperation,
  PartialTezosOperation,
  PartialTezosDelegationOperation,
  PartialTezosOriginationOperation,
  PartialTezosRevealOperation
} from './types/tezos/PartialTezosOperation'
import { ExtendedPeerInfo, PeerInfo } from './types/PeerInfo'
import { AcknowledgeResponse } from './types/beacon/messages/AcknowledgeResponse'
import { DisconnectMessage } from './types/beacon/messages/DisconnectMessage'
import { SigningType } from './types/beacon/SigningType'
import { ExtendedP2PPairingResponse, P2PPairingResponse } from './types/P2PPairingResponse'
import {
  ExtendedPostMessagePairingRequest,
  PostMessagePairingRequest
} from './types/PostMessagePairingRequest'
import {
  ExtendedPostMessagePairingResponse,
  PostMessagePairingResponse
} from './types/PostMessagePairingResponse'
import { BeaconRequestMessage } from './types/beacon/BeaconRequestMessage'
import { BeaconResponseMessage } from './types/beacon/BeaconResponseMessage'
import { ColorMode } from './types/ColorMode'
import { Optional } from './types/utils/Optional'
import { Extension } from './types/Extension'
import { PermissionEntity } from './types/PermissionEntity'
import { WalletInfo } from './types/WalletInfo'

export * from './types/beaconV3/PermissionRequest'

export * from './types/ui'

export * from './types/Regions'

// Tezos
export {
  TezosBaseOperation,
  TezosOperationType,
  TezosBlockHeader,
  MichelsonPrimitives,
  TezosTransactionParameters,
  TezosOperation
}

// Tezos Operations
export {
  TezosActivateAccountOperation,
  TezosBallotOperation,
  TezosDelegationOperation,
  TezosDoubleBakingEvidenceOperation,
  TezosDoubleEndorsementEvidenceOperation,
  TezosEndorsementOperation,
  TezosOriginationOperation,
  TezosProposalOperation,
  TezosRevealOperation,
  TezosSeedNonceRevelationOperation,
  TezosTransactionOperation,
  PartialTezosOperation,
  PartialTezosTransactionOperation,
  PartialTezosDelegationOperation,
  PartialTezosOriginationOperation,
  PartialTezosRevealOperation
}

// Beacon
export {
  AccountIdentifier,
  AppMetadata,
  Network,
  NetworkType,
  BeaconMessage,
  PermissionRequest,
  PermissionResponse,
  OperationRequest,
  OperationResponse,
  SignPayloadRequest,
  // EncryptPayloadRequest,
  SignPayloadResponse,
  // EncryptPayloadResponse,
  BroadcastRequest,
  BroadcastResponse,
  AcknowledgeResponse,
  DisconnectMessage,
  BeaconBaseMessage,
  BeaconMessageType,
  PermissionScope,
  Origin,
  AccountInfo,
  Threshold,
  SigningType,
  // EncryptionType,
  // EncryptionOperation,
  ExtensionMessageTarget,
  ExtensionMessage,
  Extension,
  EncryptedExtensionMessage,
  RequestPermissionInput,
  RequestSignPayloadInput,
  // RequestEncryptPayloadInput,
  RequestOperationInput,
  RequestBroadcastInput,
  PermissionInfo,
  PermissionEntity
}

export {
  PermissionResponseInput,
  SignPayloadResponseInput,
  // EncryptPayloadResponseInput,
  OperationResponseInput,
  BroadcastResponseInput,
  AcknowledgeResponseInput,
  ErrorResponseInput,
  PermissionResponseOutput,
  SignPayloadResponseOutput,
  // EncryptPayloadResponseOutput,
  OperationResponseOutput,
  BroadcastResponseOutput,
  PermissionRequestInput,
  SignPayloadRequestInput,
  // EncryptPayloadRequestInput,
  OperationRequestInput,
  BroadcastRequestInput,
  PermissionRequestOutput,
  SignPayloadRequestOutput,
  // EncryptPayloadRequestOutput,
  OperationRequestOutput,
  BroadcastRequestOutput,
  BeaconRequestInputMessage,
  BeaconRequestOutputMessage,
  BeaconResponseInputMessage,
  BeaconResponseOutputMessage,
  BeaconRequestMessage,
  BeaconResponseMessage
}

// Errors
export { BeaconErrorType, ErrorResponse }

// Transport
export { TransportStatus, TransportType }

// Storage
export { Storage, StorageKey, StorageKeyReturnDefaults, StorageKeyReturnType }

// Pairing

export {
  PeerInfo,
  ExtendedPeerInfo,
  PostMessagePairingRequest,
  PostMessagePairingResponse,
  ExtendedPostMessagePairingRequest,
  ExtendedPostMessagePairingResponse,
  P2PPairingRequest,
  P2PPairingResponse,
  ExtendedP2PPairingRequest,
  ExtendedP2PPairingResponse
}

export { IgnoredRequestInputProperties, defaultValues }

// Others
export { ConnectionContext, ColorMode, WalletInfo }

export { PushToken } from './types/PushToken'

// TS helpers

export { Optional }
