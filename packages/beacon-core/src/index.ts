/**
 * General docs
 * @module public
 */
import { Client } from './clients/client/Client'
import { BeaconError } from './errors/BeaconError'
import { BroadcastBeaconError } from './errors/BroadcastBeaconError'
import { NetworkNotSupportedBeaconError } from './errors/NetworkNotSupportedBeaconError'
import { NoAddressBeaconError } from './errors/NoAddressBeaconError'
import { NoPrivateKeyBeaconError } from './errors/NoPrivateKeyBeaconError'
import { NotGrantedBeaconError } from './errors/NotGrantedBeaconError'
import { ParametersInvalidBeaconError } from './errors/ParametersInvalidBeaconError'
import { TooManyOperationsBeaconError } from './errors/TooManyOperationsBeaconError'
import { TransactionInvalidBeaconError } from './errors/TransactionInvalidBeaconError'
import { UnknownBeaconError } from './errors/UnknownBeaconError'
import { Transport } from './transports/Transport'
import { ChromeStorage } from './storage/ChromeStorage'
import { LocalStorage } from './storage/LocalStorage'
import { getStorage } from './storage/getStorage'
import { Serializer } from './Serializer'
// import { RequestEncryptPayloadInput } from './types/RequestEncryptPayloadInput'
import { ClientOptions } from './clients/client/ClientOptions'
import {
  SDK_VERSION,
  BEACON_VERSION,
  PROTOCOL_VERSION_V1,
  PROTOCOL_VERSION_V2,
  LATEST_PROTOCOL_VERSION,
  DEFAULT_PROTOCOL_VERSION
} from './constants'
import {
  getPreferredMessageProtocolVersion,
  setPreferredMessageProtocolVersion
} from './message-protocol'
import { AccountManager } from './managers/AccountManager'
import { AppMetadataManager } from './managers/AppMetadataManager'
import { PermissionManager } from './managers/PermissionManager'
import { BeaconClient } from './clients/beacon-client/BeaconClient'
import { BeaconClientOptions } from './clients/beacon-client/BeaconClientOptions'
import { getAccountIdentifier } from './utils/get-account-identifier'
import { AbortedBeaconError } from './errors/AbortedBeaconError'
import { getSenderId } from './utils/get-sender-id'
import { PeerManager } from './managers/PeerManager'
import { MessageBasedClient } from './transports/clients/MessageBasedClient'
import { setDebugEnabled, getDebugEnabled } from './debug'
// import { EncryptPayloadRequest } from './types/beacon/messages/EncryptPayloadRequest'
// import { EncryptPayloadResponse } from './types/beacon/messages/EncryptPayloadResponse'
// import { EncryptionTypeNotSupportedBeaconError } from './errors/EncryptionTypeNotSupportedBeaconError'
import { SignatureTypeNotSupportedBeaconError } from './errors/SignatureTypeNotSupportedBeaconError'
import { getLogger, Logger, setLogger } from './utils/Logger'
import { windowRef } from './MockWindow'
import { CommunicationClient } from './transports/clients/CommunicationClient'
import { ClientEvents } from './transports/clients/ClientEvents'
import { WCStorage } from './storage/WCStorage'
import { IndexedDBStorage } from './storage/IndexedDBStorage'
import { StorageValidator } from './storage/StorageValidator'
import { MultiTabChannel } from './utils/multi-tab-channel'
import getError from './errors/get-error'
// import { EncryptionType } from './types/EncryptionType'
// import { EncryptionOperation } from './types/EncryptionOperation'

// Clients
export { BeaconClient, BeaconClientOptions, Client, ClientOptions, ClientEvents }

// Errors
export {
  getError,
  BeaconError,
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
  // EncryptionTypeNotSupportedBeaconError,
  UnknownBeaconError
}

// Transport
export { Transport, MessageBasedClient, CommunicationClient }

// Storage
export { ChromeStorage, LocalStorage, WCStorage, IndexedDBStorage, StorageValidator, getStorage }

// Managers
export { PeerManager, AccountManager, AppMetadataManager, PermissionManager }

// Constants
export {
  SDK_VERSION,
  BEACON_VERSION,
  PROTOCOL_VERSION_V1,
  PROTOCOL_VERSION_V2,
  LATEST_PROTOCOL_VERSION,
  DEFAULT_PROTOCOL_VERSION,
  getPreferredMessageProtocolVersion,
  setPreferredMessageProtocolVersion
}

// Utils
export { getSenderId, getAccountIdentifier, windowRef, MultiTabChannel }
export { usesWrappedMessages, MESSAGE_WRAPPED_FROM_VERSION } from './utils/message-utils'

// Diagnostics
export {
  gatherDiagnostics,
  buildErrorContext,
  serializeErrorContext,
  copyErrorContextToClipboard,
  SENSITIVE_STORAGE_KEYS
} from './utils/diagnostics'

// Error codes
export { ERROR_CODES, WC_ERROR_CODES, MATRIX_ERROR_CODES, PM_ERROR_CODES, BLOCKCHAIN_ERROR_CODES, BEACON_ERROR_CODES } from './errors/error-codes'
export type { ErrorCode } from './errors/error-codes'

// Others
export { Serializer, Logger, setLogger, getLogger }

// Debug
export { setDebugEnabled, getDebugEnabled }

export { NOTIFICATION_ORACLE_URL, BACKEND_URL } from './constants'
