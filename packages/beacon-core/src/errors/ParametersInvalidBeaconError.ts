import { BeaconErrorType } from '@airgap/beacon-types'

import { BEACON_ERROR_CODES } from './error-codes'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class ParametersInvalidBeaconError extends BeaconError {
  public name: string = 'ParametersInvalidBeaconError'
  public title: string = 'Parameters Invalid'

  constructor() {
    super(
      BeaconErrorType.PARAMETERS_INVALID_ERROR,
      'Some of the parameters you provided are invalid and the request could not be completed. Please check your inputs and try again.',
      BEACON_ERROR_CODES.PARAMETERS_INVALID
    )
  }
}
