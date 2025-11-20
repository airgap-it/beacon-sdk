import { BeaconErrorType } from '@airgap/beacon-types'

import { BEACON_ERROR_CODES } from './error-codes'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class AbortedBeaconError extends BeaconError {
  public name: string = 'UnknownBeaconError'
  public title: string = 'Aborted'

  constructor() {
    super(
      BeaconErrorType.ABORTED_ERROR,
      'The action was aborted by the user.',
      BEACON_ERROR_CODES.ABORTED_BY_USER
    )
  }
}
