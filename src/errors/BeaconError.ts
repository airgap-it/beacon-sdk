import { assertNever } from '../utils/assert-never'
import {
  AbortedBeaconError,
  BeaconErrorType,
  UnknownBeaconError,
  NetworkNotSupportedBeaconError,
  NoAddressBeaconError,
  NoPrivateKeyBeaconError,
  NotGrantedBeaconError,
  ParametersInvalidBeaconError,
  TooManyOperationsBeaconError,
  TransactionInvalidBeaconError,
  SignatureTypeNotSupportedBeaconError,
  BroadcastBeaconError,
  EncryptionTypeNotSupportedBeaconError
} from '..'

/**
 * @category Error
 */
export abstract class BeaconError implements Error {
  public name: string = 'BeaconError'
  public message: string

  public title: string = 'Error' // Visible in the UI
  public description: string // Visible in the UI

  public get fullDescription(): string {
    return this.description
  }

  constructor(errorType: BeaconErrorType, message: string) {
    this.message = `[${errorType}]:${message}`
    this.description = message
  }

  public static getError(errorType: BeaconErrorType, errorData: unknown): BeaconError {
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
      case BeaconErrorType.ENCRYPTION_TYPE_NOT_SUPPORTED:
        return new EncryptionTypeNotSupportedBeaconError()
      case BeaconErrorType.ABORTED_ERROR:
        return new AbortedBeaconError()
      case BeaconErrorType.UNKNOWN_ERROR:
        return new UnknownBeaconError()
      default:
        assertNever(errorType)
    }
  }
}
