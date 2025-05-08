import { BeaconErrorType } from '@airgap/beacon-types'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class TooManyOperationsBeaconError extends BeaconError {
  public name: string = 'TooManyOperationsBeaconError'
  public title: string = 'Too Many Operations'

  constructor() {
    super(
      BeaconErrorType.TOO_MANY_OPERATIONS,
      'The request contains too many transactions. Please include fewer operations and try again.'
    )
  }
}
