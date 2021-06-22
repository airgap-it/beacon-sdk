export enum BeaconErrorType {
  /**
   * {@link BroadcastBeaconError}
   *
   * Will be returned if the user chooses that the transaction is broadcast but there is an error (eg. node not available).
   *
   * Returned by: Broadcast | Operation Request
   */
  BROADCAST_ERROR = 'BROADCAST_ERROR',

  /**
   * {@link NetworkNotSupportedBeaconError}
   *
   * Will be returned if the selected network is not supported by the wallet / extension.
   *
   * Returned by: Permission
   */
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',

  /**
   * {@link NoAddressBeaconError}
   *
   * Will be returned if there is no address present for the protocol / network requested.
   *
   * Returned by: Permission
   */
  NO_ADDRESS_ERROR = 'NO_ADDRESS_ERROR',

  /**
   * {@link NoPrivateKeyBeaconError}
   *
   * Will be returned if the private key matching the sourceAddress could not be found.
   *
   * Returned by: Sign
   */
  NO_PRIVATE_KEY_FOUND_ERROR = 'NO_PRIVATE_KEY_FOUND_ERROR',

  /**
   * {@link NotGrantedBeaconError}
   *
   * Will be returned if the signature was blocked // (Not needed?) Permission: Will be returned if the permissions requested by the App were not granted.
   *
   * Returned by: Sign
   */
  NOT_GRANTED_ERROR = 'NOT_GRANTED_ERROR',

  /**
   * {@link ParametersInvalidBeaconError}
   *
   * Will be returned if any of the parameters are invalid.
   *
   * Returned by: Operation Request
   */
  PARAMETERS_INVALID_ERROR = 'PARAMETERS_INVALID_ERROR',

  /**
   * {@link TooManyOperationsBeaconError}
   *
   * Will be returned if too many operations were in the request and they were not able to fit into a single operation group.
   *
   * Returned by: Operation Request
   */
  TOO_MANY_OPERATIONS = 'TOO_MANY_OPERATIONS',

  /**
   * {@link TransactionInvalidBeaconError}
   *
   * Will be returned if the transaction is not parsable or is rejected by the node.
   *
   * Returned by: Broadcast
   */
  TRANSACTION_INVALID_ERROR = 'TRANSACTION_INVALID_ERROR',

  /**
   * {@link SignatureTypeNotSupportedBeaconError}
   *
   * Will be returned if the signing type is not supported.
   *
   * Returned by: Sign
   */
  SIGNATURE_TYPE_NOT_SUPPORTED = 'SIGNATURE_TYPE_NOT_SUPPORTED',

  /**
   * {@link EncryptionTypeNotSupportedBeaconError}
   *
   * Will be returned if the encryption type is not supported.
   *
   * Returned by: Encrypt
   */
  ENCRYPTION_TYPE_NOT_SUPPORTED = 'ENCRYPTION_TYPE_NOT_SUPPORTED',

  /**
   * {@link AbortedBeaconError}
   *
   * Will be returned if the request was aborted by the user or the wallet.
   *
   * Returned by: Permission | Operation Request | Sign Request | Broadcast
   */
  ABORTED_ERROR = 'ABORTED_ERROR',

  /**
   * {@link UnknownBeaconError}
   *
   * Used as a wildcard if an unexpected error occured.
   *
   * Returned by: Permission | Operation Request | Sign Request | Broadcast
   */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
