/**
 * General docs
 * @module public
 */
import { P2PCommunicationClient } from './transports/clients/P2PCommunicationClient'
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
import { PostMessageTransport } from './transports/PostMessageTransport'
import { Transport } from './transports/Transport'
import { P2PTransport } from './transports/P2PTransport'
import { ChromeStorage } from './storage/ChromeStorage'
import { LocalStorage } from './storage/LocalStorage'
import { getStorage } from './storage/getStorage'
import { Serializer } from './Serializer'
// import { RequestEncryptPayloadInput } from './types/RequestEncryptPayloadInput'
import { ClientOptions } from './clients/client/ClientOptions'
import { SDK_VERSION, BEACON_VERSION } from './constants'
import { AccountManager } from './managers/AccountManager'
import { AppMetadataManager } from './managers/AppMetadataManager'
import { PermissionManager } from './managers/PermissionManager'
import { getAddressFromPublicKey } from './utils/crypto'
import { BeaconClient } from './clients/beacon-client/BeaconClient'
import { BeaconClientOptions } from './clients/beacon-client/BeaconClientOptions'
import { getAccountIdentifier } from './utils/get-account-identifier'
import { AbortedBeaconError } from './errors/AbortedBeaconError'
import { availableTransports } from './utils/available-transports'
import { DappP2PTransport } from './transports/DappP2PTransport'
import { DappPostMessageTransport } from './transports/DappPostMessageTransport'
import { WalletP2PTransport } from './transports/WalletP2PTransport'
import { WalletPostMessageTransport } from './transports/WalletPostMessageTransport'
import { getSenderId } from './utils/get-sender-id'
import { PeerManager } from './managers/PeerManager'
import { MessageBasedClient } from './transports/clients/MessageBasedClient'
import { setDebugEnabled, getDebugEnabled } from './debug'
// import { EncryptPayloadRequest } from './types/beacon/messages/EncryptPayloadRequest'
// import { EncryptPayloadResponse } from './types/beacon/messages/EncryptPayloadResponse'
// import { EncryptionTypeNotSupportedBeaconError } from './errors/EncryptionTypeNotSupportedBeaconError'
import { SignatureTypeNotSupportedBeaconError } from './errors/SignatureTypeNotSupportedBeaconError'
import { Logger } from './utils/Logger'
import { IncomingRequestInterceptor } from './interceptors/IncomingRequestInterceptor'
import { OutgoingResponseInterceptor } from './interceptors/OutgoingResponseInterceptor'
import { ExposedPromise } from './utils/exposed-promise'
import { generateGUID } from './utils/generate-uuid'
import { windowRef } from './MockWindow'
// import { EncryptionType } from './types/EncryptionType'
// import { EncryptionOperation } from './types/EncryptionOperation'

// Clients
export { BeaconClient, BeaconClientOptions, Client, ClientOptions, P2PCommunicationClient }

// Errors
export {
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
export {
  Transport,
  PostMessageTransport,
  P2PTransport,
  WalletP2PTransport,
  WalletPostMessageTransport,
  DappP2PTransport,
  DappPostMessageTransport,
  MessageBasedClient
}

// Storage
export { ChromeStorage, LocalStorage, getStorage }

// Managers
export { PeerManager, AccountManager, AppMetadataManager, PermissionManager }

// Constants
export { SDK_VERSION, BEACON_VERSION }

// Utils
export { getSenderId, getAccountIdentifier, getAddressFromPublicKey, generateGUID, windowRef }

// Others
export {
  Serializer,
  availableTransports,
  IncomingRequestInterceptor,
  OutgoingResponseInterceptor,
  ExposedPromise,
  Logger
}

// Debug
export { setDebugEnabled, getDebugEnabled }
