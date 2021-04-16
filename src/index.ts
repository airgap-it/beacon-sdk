/**
 * General docs
 * @module public
 */
import { P2PCommunicationClient } from './transports/clients/P2PCommunicationClient'
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
import { Client } from './clients/client/Client'
import { WalletClient } from './clients/wallet-client/WalletClient'
import { DAppClient } from './clients/dapp-client/DAppClient'
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
import { ErrorResponse } from './types/beacon/messages/ErrorResponse'
import { TransportStatus } from './types/transport/TransportStatus'
import { TransportType } from './types/transport/TransportType'
import { PostMessageTransport } from './transports/PostMessageTransport'
import { Transport } from './transports/Transport'
import { P2PTransport } from './transports/P2PTransport'
import { Storage } from './storage/Storage'
import { StorageKey } from './types/storage/StorageKey'
import { StorageKeyReturnDefaults } from './types/storage/StorageKeyReturnDefaults'
import { StorageKeyReturnType } from './types/storage/StorageKeyReturnType'
import { ExtendedP2PPairingRequest, P2PPairingRequest } from './types/P2PPairingRequest'
import { ChromeStorage } from './storage/ChromeStorage'
import { LocalStorage } from './storage/LocalStorage'
import { getStorage } from './storage/getStorage'
import { BeaconMessage } from './types/beacon/BeaconMessage'
import { Serializer } from './Serializer'
import { RequestPermissionInput } from './types/RequestPermissionInput'
import { RequestSignPayloadInput } from './types/RequestSignPayloadInput'
import { RequestEncryptPayloadInput } from './types/RequestEncryptPayloadInput'
import { RequestOperationInput } from './types/RequestOperationInput'
import { RequestBroadcastInput } from './types/RequestBroadcastInput'
import {
  PermissionResponseInput,
  SignPayloadResponseInput,
  EncryptPayloadResponseInput,
  OperationResponseInput,
  BroadcastResponseInput,
  BeaconResponseInputMessage,
  AcknowledgeResponseInput,
  ErrorResponseInput
} from './types/beacon/messages/BeaconResponseInputMessage'
import {
  PermissionResponseOutput,
  SignPayloadResponseOutput,
  EncryptPayloadResponseOutput,
  OperationResponseOutput,
  BroadcastResponseOutput,
  BeaconResponseOutputMessage
} from './types/beacon/messages/BeaconResponseOutputMessage'
import {
  PermissionRequestInput,
  SignPayloadRequestInput,
  EncryptPayloadRequestInput,
  OperationRequestInput,
  BroadcastRequestInput,
  BeaconRequestInputMessage
} from './types/beacon/messages/BeaconRequestInputMessage'
import {
  PermissionRequestOutput,
  SignPayloadRequestOutput,
  EncryptPayloadRequestOutput,
  OperationRequestOutput,
  BroadcastRequestOutput,
  BeaconRequestOutputMessage
} from './types/beacon/messages/BeaconRequestOutputMessage'
import { ClientOptions } from './clients/client/ClientOptions'
import { DAppClientOptions } from './clients/dapp-client/DAppClientOptions'
import { WalletClientOptions } from './clients/wallet-client/WalletClientOptions'
import { PermissionInfo } from './types/PermissionInfo'
import { SDK_VERSION, BEACON_VERSION } from './constants'
import { AccountManager } from './managers/AccountManager'
import { AppMetadataManager } from './managers/AppMetadataManager'
import { PermissionManager } from './managers/PermissionManager'
import { BeaconEvent, BeaconEventHandler, defaultEventCallbacks } from './events'
import { getAddressFromPublicKey } from './utils/crypto'
import { BeaconClient } from './clients/beacon-client/BeaconClient'
import { BeaconClientOptions } from './clients/beacon-client/BeaconClientOptions'
import { getAccountIdentifier } from './utils/get-account-identifier'
import { ConnectionContext } from './types/ConnectionContext'
import { Threshold } from './types/beacon/Threshold'
import {
  PartialTezosTransactionOperation,
  PartialTezosOperation,
  PartialTezosDelegationOperation,
  PartialTezosOriginationOperation,
  PartialTezosRevealOperation
} from './types/tezos/PartialTezosOperation'
import { AbortedBeaconError } from './errors/AbortedBeaconError'
import { ExtendedPeerInfo, PeerInfo } from './types/PeerInfo'
import { availableTransports } from './utils/available-transports'
import { AcknowledgeResponse } from './types/beacon/messages/AcknowledgeResponse'
import { DisconnectMessage } from './types/beacon/messages/DisconnectMessage'
import { DappP2PTransport } from './transports/DappP2PTransport'
import { DappPostMessageTransport } from './transports/DappPostMessageTransport'
import { WalletP2PTransport } from './transports/WalletP2PTransport'
import { WalletPostMessageTransport } from './transports/WalletPostMessageTransport'
import { getSenderId } from './utils/get-sender-id'
import { SigningType } from './types/beacon/SigningType'
import { ExtendedP2PPairingResponse } from './types/P2PPairingResponse'
import {
  ExtendedPostMessagePairingRequest,
  PostMessagePairingRequest
} from './types/PostMessagePairingRequest'
import { ExtendedPostMessagePairingResponse } from './types/PostMessagePairingResponse'
import { PeerManager } from './managers/PeerManager'
import { MessageBasedClient } from './transports/clients/MessageBasedClient'
import { BeaconRequestMessage } from './types/beacon/BeaconRequestMessage'
import { BeaconResponseMessage } from './types/beacon/BeaconResponseMessage'
import { Pairing } from './ui/alert/Pairing'
import { BlockExplorer } from './utils/block-explorer'
import { TezblockBlockExplorer } from './utils/tezblock-blockexplorer'
import { setDebugEnabled, getDebugEnabled } from './debug'
import { ColorMode } from './types/ColorMode'
import {
  EncryptionType,
  EncryptPayloadRequest
} from './types/beacon/messages/EncryptPayloadRequest'
import { EncryptPayloadResponse } from './types/beacon/messages/EncryptPayloadResponse'
import { EncryptionTypeNotSupportedBeaconError } from './errors/EncryptionTypeNotSupportedBeaconError'
import { SignatureTypeNotSupportedBeaconError } from './errors/SignatureTypeNotSupportedBeaconError'

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

// Clients
export {
  BeaconClient,
  BeaconClientOptions,
  Client,
  ClientOptions,
  DAppClient,
  DAppClientOptions,
  WalletClient,
  WalletClientOptions,
  P2PCommunicationClient
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
  EncryptPayloadRequest,
  SignPayloadResponse,
  EncryptPayloadResponse,
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
  EncryptionType,
  ExtensionMessageTarget,
  ExtensionMessage,
  EncryptedExtensionMessage,
  RequestPermissionInput,
  RequestSignPayloadInput,
  RequestEncryptPayloadInput,
  RequestOperationInput,
  RequestBroadcastInput,
  PermissionInfo
}

export {
  PermissionResponseInput,
  SignPayloadResponseInput,
  EncryptPayloadResponseInput,
  OperationResponseInput,
  BroadcastResponseInput,
  AcknowledgeResponseInput,
  ErrorResponseInput,
  PermissionResponseOutput,
  SignPayloadResponseOutput,
  EncryptPayloadResponseOutput,
  OperationResponseOutput,
  BroadcastResponseOutput,
  PermissionRequestInput,
  SignPayloadRequestInput,
  EncryptPayloadRequestInput,
  OperationRequestInput,
  BroadcastRequestInput,
  PermissionRequestOutput,
  SignPayloadRequestOutput,
  EncryptPayloadRequestOutput,
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
export {
  BeaconError,
  BeaconErrorType,
  ErrorResponse,
  AbortedBeaconError,
  BroadcastBeaconError,
  NetworkNotSupportedBeaconError,
  NoAddressBeaconError,
  NoPrivateKeyBeaconError,
  NotGrantedBeaconError,
  ParametersInvalidBeaconError,
  TooManyOperationsBeaconError,
  TransactionInvalidBeaconError,
  SignatureTypeNotSupportedBeaconError,
  EncryptionTypeNotSupportedBeaconError,
  UnknownBeaconError
}

// Transport
export {
  TransportStatus,
  TransportType,
  Transport,
  PostMessageTransport,
  P2PTransport,
  WalletP2PTransport,
  WalletPostMessageTransport,
  DappP2PTransport,
  DappPostMessageTransport,
  MessageBasedClient,
  Pairing
}

// Events
export { BeaconEvent, BeaconEventHandler, defaultEventCallbacks }

// Storage
export {
  Storage,
  StorageKey,
  StorageKeyReturnDefaults,
  StorageKeyReturnType,
  ChromeStorage,
  LocalStorage,
  getStorage
}

// Managers
export { PeerManager, AccountManager, AppMetadataManager, PermissionManager }

// Constants
export { SDK_VERSION, BEACON_VERSION }

// Utils
export { getSenderId, getAccountIdentifier, getAddressFromPublicKey }

// Pairing

export {
  PeerInfo,
  ExtendedPeerInfo,
  PostMessagePairingRequest,
  ExtendedPostMessagePairingRequest,
  ExtendedPostMessagePairingResponse,
  P2PPairingRequest,
  ExtendedP2PPairingRequest,
  ExtendedP2PPairingResponse
}

// BlockExplorer
export { BlockExplorer, TezblockBlockExplorer }

// Others
export { ConnectionContext, Serializer, availableTransports, ColorMode }

// Debug
export { setDebugEnabled, getDebugEnabled }
