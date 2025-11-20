import { BeaconErrorType } from '@airgap/beacon-types'

import { BEACON_ERROR_CODES } from './error-codes'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class NoAddressBeaconError extends BeaconError {
  public name: string = 'NoAddressBeaconError'
  public title: string = 'No Address'

  constructor() {
    super(
      BeaconErrorType.NO_ADDRESS_ERROR,
      'The wallet does not have an account set up. Please make sure to set up your wallet and try again.',
      BEACON_ERROR_CODES.NO_ADDRESS
    )
  }
}
