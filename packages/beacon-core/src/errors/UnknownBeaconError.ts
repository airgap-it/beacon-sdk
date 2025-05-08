import { BeaconErrorType } from '@airgap/beacon-types'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class UnknownBeaconError extends BeaconError {
  public name: string = 'UnknownBeaconError'
  public title: string = 'Error'

  constructor() {
    super(
      BeaconErrorType.UNKNOWN_ERROR,
      'An unknown error occured. Please try again or report it to a developer.'
    )
  }
}
