import { WalletCommunicationClient } from './WalletCommunicationClient'
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
import { TezosOperation } from './types/tezos/TezosOperation'
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
import { MichelineMichelsonV1Expression } from './types/tezos/MichelineMichelsonV1Expression'
import { MichelsonPrimitives } from './types/tezos/MichelsonPrimitives'
import { TezosTransactionParameters } from './types/tezos/TezosTransactionParameters'
import { Origin } from './types/Origin'
import { AccountInfo } from './types/AccountInfo'
import { ExtensionMessage } from './types/ExtensionMessage'
import { ExtensionMessageTarget } from './types/ExtensionMessageTarget'
import { TezosOperations } from './types/tezos/TezosOperations'
import { BaseClient } from './clients/Client'
import { WalletClient } from './clients/WalletClient'
import { DAppClient } from './clients/DAppClient'
import { BeaconError } from './errors/BeaconError'
import { BeaconErrorType } from './types/BeaconErrorType'
import { BroadcastBeaconError } from './errors/BroadcastBeaconError'
import { NetworkNotSupportedBeaconError } from './errors/NetworkNotSupportedBeaconError'
import { NoAddressBeaconError } from './errors/NoAddressBeaconError'
import { NoPrivateKeyBeaconError } from './errors/NoPrivateKeyBeaconError'
import { NotGrantedBeaconError } from './errors/NotGrantedBeaconError'
import { ParametersInvalidBeaconError } from './errors/ParametersInvalidBeaconError'
import { TooManyOperationsBeaconError } from './errors/TooManyOperationsBeaconError'
import { TransactionInvalidBeaconError } from './errors/TransactionInvalidBeaconError'
import { UnknownBeaconError } from './errors/UnknownBeaconError'
import { BeaconErrorMessage } from './types/BeaconErrorMessage'

export { WalletCommunicationClient }

// Tezos
export {
  TezosOperation,
  TezosOperationType,
  TezosBlockHeader,
  MichelineMichelsonV1Expression,
  MichelsonPrimitives,
  TezosTransactionParameters,
  TezosOperations
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
  TezosTransactionOperation
}

// Clients
export { BaseClient, DAppClient, WalletClient }

// Beacon
export {
  AppMetadata,
  Network,
  NetworkType,
  PermissionRequest,
  PermissionResponse,
  OperationRequest,
  OperationResponse,
  SignPayloadRequest,
  SignPayloadResponse,
  BroadcastRequest,
  BroadcastResponse,
  BeaconBaseMessage,
  BeaconMessageType,
  PermissionScope,
  Origin,
  AccountInfo,
  ExtensionMessageTarget,
  ExtensionMessage
}

// Errors
export {
  BeaconError,
  BeaconErrorType,
  BeaconErrorMessage,
  BroadcastBeaconError,
  NetworkNotSupportedBeaconError,
  NoAddressBeaconError,
  NoPrivateKeyBeaconError,
  NotGrantedBeaconError,
  ParametersInvalidBeaconError,
  TooManyOperationsBeaconError,
  TransactionInvalidBeaconError,
  UnknownBeaconError
}
