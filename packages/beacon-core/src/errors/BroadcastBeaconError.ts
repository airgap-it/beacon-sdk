import { BeaconErrorType } from '@airgap/beacon-types'

import { BEACON_ERROR_CODES } from './error-codes'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class BroadcastBeaconError extends BeaconError {
  public name: string = 'BroadcastBeaconError'
  public title: string = 'Broadcast Error'

  constructor() {
    super(
      BeaconErrorType.BROADCAST_ERROR,
      'The transaction could not be broadcast to the network. Please try again.',
      BEACON_ERROR_CODES.BROADCAST_ERROR
    )
  }
}
