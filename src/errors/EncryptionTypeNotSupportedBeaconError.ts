import { BeaconError, BeaconErrorType } from '..'

/**
 * @category Error
 */
export class EncryptionTypeNotSupportedBeaconError extends BeaconError {
  public name: string = 'EncryptionTypeNotSupportedBeaconError'
  public title: string = 'Encryption Type Not Supported'

  constructor() {
    super(
      BeaconErrorType.ENCRYPTION_TYPE_NOT_SUPPORTED,
      'The wallet is not able to encrypt payloads with this type.'
    )
  }
}
