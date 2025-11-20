import { BeaconErrorType } from '@airgap/beacon-types'

import { BEACON_ERROR_CODES } from './error-codes'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class SignatureTypeNotSupportedBeaconError extends BeaconError {
  public name: string = 'SignatureTypeNotSupportedBeaconError'
  public title: string = 'Signature Type Not Supported'

  constructor() {
    super(
      BeaconErrorType.SIGNATURE_TYPE_NOT_SUPPORTED,
      'The wallet is not able to sign payloads of this type.',
      BEACON_ERROR_CODES.SIGNATURE_TYPE_NOT_SUPPORTED
    )
  }
}
