export enum BeaconErrorType {
  BROADCAST_ERROR = 'BROADCAST_ERROR', // Broadcast | Operation Request: Will be returned if the user chooses that the transaction is broadcast but there is an error (eg. node not available).
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED', // Permission: Will be returned if the selected network is not supported by the wallet / extension.
  NO_ADDRESS_ERROR = 'NO_ADDRESS_ERROR', // Permission: Will be returned if there is no address present for the protocol / network requested.
  NO_PRIVATE_KEY_FOUND_ERROR = 'NO_PRIVATE_KEY_FOUND_ERROR', // Sign: Will be returned if the private key matching the sourceAddress could not be found.
  NOT_GRANTED_ERROR = 'NOT_GRANTED_ERROR', // Sign: Will be returned if the signature was blocked // (Not needed?) Permission: Will be returned if the permissions requested by the App were not granted.
  PARAMETERS_INVALID_ERROR = 'PARAMETERS_INVALID_ERROR', // Operation Request: Will be returned if any of the parameters are invalid.
  TOO_MANY_OPERATIONS = 'TOO_MANY_OPERATIONS', // Operation Request: Will be returned if too many operations were in the request and they were not able to fit into a single operation group.
  TRANSACTION_INVALID_ERROR = 'TRANSACTION_INVALID_ERROR', // Broadcast: Will be returned if the transaction is not parsable or is rejected by the node.
  SIGNATURE_TYPE_NOT_SUPPORTED = 'SIGNATURE_TYPE_NOT_SUPPORTED', // Sign: Will be returned if the signing type is not supported.
  ABORTED_ERROR = 'ABORTED_ERROR', // Permission | Operation Request | Sign Request | Broadcast: Will be returned if the request was aborted by the user or the wallet.
  UNKNOWN_ERROR = 'UNKNOWN_ERROR' // Used as a wildcard if an unexpected error occured.
}
