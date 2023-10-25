import { BeaconError } from '..'
import { BeaconErrorType } from '@mavrykdynamics/beacon-types'

/**
 * @category Error
 */
export class SignatureTypeNotSupportedBeaconError extends BeaconError {
  public name: string = 'SignatureTypeNotSupportedBeaconError'
  public title: string = 'Signature Type Not Supported'

  constructor() {
    super(
      BeaconErrorType.SIGNATURE_TYPE_NOT_SUPPORTED,
      'The wallet is not able to sign payloads of this type.'
    )
  }
}
