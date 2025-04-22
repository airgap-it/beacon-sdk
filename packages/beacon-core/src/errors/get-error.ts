// src/errors/index.ts
import { BeaconError } from './BeaconError'
import { BroadcastBeaconError } from './BroadcastBeaconError'
import { NetworkNotSupportedBeaconError } from './NetworkNotSupportedBeaconError'
import { BeaconErrorType } from '@airgap/beacon-types'
import { assertNever } from '../utils/assert-never'
import { AbortedBeaconError } from './AbortedBeaconError'
import { NoAddressBeaconError } from './NoAddressBeaconError'
import { NoPrivateKeyBeaconError } from './NoPrivateKeyBeaconError'
import { NotGrantedBeaconError } from './NotGrantedBeaconError'
import { ParametersInvalidBeaconError } from './ParametersInvalidBeaconError'
import { SignatureTypeNotSupportedBeaconError } from './SignatureTypeNotSupportedBeaconError'
import { TooManyOperationsBeaconError } from './TooManyOperationsBeaconError'
import { TransactionInvalidBeaconError } from './TransactionInvalidBeaconError'
import { UnknownBeaconError } from './UnknownBeaconError'

export { BeaconError } // plus each subclass, if you like:
export { BroadcastBeaconError, NetworkNotSupportedBeaconError /* … */ }

const getError = (errorType: BeaconErrorType, errorData: unknown): BeaconError => {
  switch (errorType) {
    case BeaconErrorType.BROADCAST_ERROR:
      return new BroadcastBeaconError()
    case BeaconErrorType.NETWORK_NOT_SUPPORTED:
      return new NetworkNotSupportedBeaconError()
    case BeaconErrorType.NO_ADDRESS_ERROR:
      return new NoAddressBeaconError()
    case BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR:
      return new NoPrivateKeyBeaconError()
    case BeaconErrorType.NOT_GRANTED_ERROR:
      return new NotGrantedBeaconError()
    case BeaconErrorType.PARAMETERS_INVALID_ERROR:
      return new ParametersInvalidBeaconError()
    case BeaconErrorType.TOO_MANY_OPERATIONS:
      return new TooManyOperationsBeaconError()
    case BeaconErrorType.TRANSACTION_INVALID_ERROR:
      return new TransactionInvalidBeaconError(errorData)
    case BeaconErrorType.SIGNATURE_TYPE_NOT_SUPPORTED:
      return new SignatureTypeNotSupportedBeaconError()
    // case BeaconErrorType.ENCRYPTION_TYPE_NOT_SUPPORTED:
    //   return new EncryptionTypeNotSupportedBeaconError()
    case BeaconErrorType.ABORTED_ERROR:
      return new AbortedBeaconError()
    case BeaconErrorType.UNKNOWN_ERROR:
      return new UnknownBeaconError()
    default:
      assertNever(errorType)
  }
}

export default getError
