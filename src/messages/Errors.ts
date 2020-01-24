import { BaseMessage } from './Messages'

export enum BeaconErrors {
  NO_ADDRESS_ERROR = 'NO_ADDRESS_ERROR', // Permission: Will be returned if there is no address present for the protocol / network requested.
  NOT_GRANTED_ERROR = 'NOT_GRANTED_ERROR', // Sign: Will be returned if the signature was blocked // (Not needed?) Permission: Will be returned if the permissions requested by the App were not granted.
  NO_PRIVATE_KEY_FOUND_ERROR = 'NO_PRIVATE_KEY_FOUND_ERROR', // Sign: Will be returned if the private key matching the sourceAddress could not be found.
  PARAMETERS_INVALID_ERROR = 'PARAMETERS_INVALID_ERROR', // Operation Request: Will be returned if any of the parameters are invalid.
  BROADCAST_ERROR = 'BROADCAST_ERROR', // Broadcast | Operation Request: Will be returned if the user choses that the transaction is broadcast but there is an error (eg. node not available).
  TRANSACTION_INVALID_ERROR = 'TRANSACTION_INVALID_ERROR' // Broadcast: Will be returned if the transaction is not parsable or is rejected by the node.
}

export interface BeaconError extends BaseMessage {
  error: BeaconErrors
}

export interface NotGrantedBeaconError extends BeaconError {
  error: BeaconErrors.NOT_GRANTED_ERROR
}

export interface NoAddressBeaconError extends BeaconError {
  error: BeaconErrors.NO_ADDRESS_ERROR
}

export interface NoPrivateKeyBeaconError extends BeaconError {
  error: BeaconErrors.NO_PRIVATE_KEY_FOUND_ERROR
}

export interface ParametersInvalidBeaconError extends BeaconError {
  error: BeaconErrors.PARAMETERS_INVALID_ERROR
}

export interface TransactionInvalidBeaconError extends BeaconError {
  error: BeaconErrors.TRANSACTION_INVALID_ERROR
}

export interface BroadcastBeaconError extends BeaconError {
  error: BeaconErrors.BROADCAST_ERROR
}
