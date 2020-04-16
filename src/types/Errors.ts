import { BaseMessage } from './Messages'

export enum BeaconErrorType {
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED', // Permission: Will be returned if the selected network is not supported by the wallet / extension.
  NO_ADDRESS_ERROR = 'NO_ADDRESS_ERROR', // Permission: Will be returned if there is no address present for the protocol / network requested.
  NOT_GRANTED_ERROR = 'NOT_GRANTED_ERROR', // Sign: Will be returned if the signature was blocked // (Not needed?) Permission: Will be returned if the permissions requested by the App were not granted.
  NO_PRIVATE_KEY_FOUND_ERROR = 'NO_PRIVATE_KEY_FOUND_ERROR', // Sign: Will be returned if the private key matching the sourceAddress could not be found.
  PARAMETERS_INVALID_ERROR = 'PARAMETERS_INVALID_ERROR', // Operation Request: Will be returned if any of the parameters are invalid.
  BROADCAST_ERROR = 'BROADCAST_ERROR', // Broadcast | Operation Request: Will be returned if the user choses that the transaction is broadcast but there is an error (eg. node not available).
  TRANSACTION_INVALID_ERROR = 'TRANSACTION_INVALID_ERROR', // Broadcast: Will be returned if the transaction is not parsable or is rejected by the node.
  TOO_MANY_OPERATIONS = 'TOO_MANY_OPERATIONS' // Operation Request: Will be returned if too many operations were in the request and they were not able to fit into a single operation group.
}

const errorDescriptions: { [key in BeaconErrorType]: string } = {
  [BeaconErrorType.NETWORK_NOT_SUPPORTED]:
    'The wallet does not support this network. Please chose another one.',
  [BeaconErrorType.NO_ADDRESS_ERROR]:
    'The wallet does not have an account set up. Please make sure to set up your wallet and try again.',
  [BeaconErrorType.NOT_GRANTED_ERROR]:
    'You do not have the necessary permissions to perform this action. Please initiate another permission request and give the necessary permissions.',
  [BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR]:
    'The account you are trying to interact with is not available. Please make sure to add the account to your wallet and try again.',
  [BeaconErrorType.PARAMETERS_INVALID_ERROR]:
    'Some of the parameters you provided are invalid and the request could not be completed. Please check your inputs and try again.',
  [BeaconErrorType.BROADCAST_ERROR]:
    'The transaction could not be broadcast to the network. Please try again.',
  [BeaconErrorType.TRANSACTION_INVALID_ERROR]:
    'The transaction is invalid and the node did not accept it.',
  [BeaconErrorType.TOO_MANY_OPERATIONS]:
    'The request contains too many transactions. Please include fewer operations and try again.'
}

export interface BeaconError extends BaseMessage {
  errorType: BeaconErrorType
}

export interface NetworkNotSupportedError extends BeaconError {
  errorType: BeaconErrorType.NETWORK_NOT_SUPPORTED
}

export interface NotGrantedBeaconError extends BeaconError {
  errorType: BeaconErrorType.NOT_GRANTED_ERROR
}

export interface NoAddressBeaconError extends BeaconError {
  errorType: BeaconErrorType.NO_ADDRESS_ERROR
}

export interface NoPrivateKeyBeaconError extends BeaconError {
  errorType: BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR
}

export interface ParametersInvalidBeaconError extends BeaconError {
  errorType: BeaconErrorType.PARAMETERS_INVALID_ERROR
  invalidParameters: { [key: string]: unknown }
}

export interface TransactionInvalidBeaconError extends BeaconError {
  errorType: BeaconErrorType.TRANSACTION_INVALID_ERROR
}

export interface BroadcastBeaconError extends BeaconError {
  errorType: BeaconErrorType.BROADCAST_ERROR
}

export interface TooManyOperationsBeaconError extends BeaconError {
  errorType: BeaconErrorType.TOO_MANY_OPERATIONS
}

/* eslint-disable prefer-arrow/prefer-arrow-functions */
export function getErrorMessageForError(error: BeaconError): string {
  return errorDescriptions[error.type] || 'Unknown error'
}
/* eslint-enable prefer-arrow/prefer-arrow-functions */
