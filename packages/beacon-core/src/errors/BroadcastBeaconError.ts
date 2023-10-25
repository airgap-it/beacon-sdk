import { BeaconError } from '..'
import { BeaconErrorType } from '@mavrykdynamics/beacon-types'

/**
 * @category Error
 */
export class BroadcastBeaconError extends BeaconError {
  public name: string = 'BroadcastBeaconError'
  public title: string = 'Broadcast Error'

  constructor() {
    super(
      BeaconErrorType.BROADCAST_ERROR,
      'The transaction could not be broadcast to the network. Please try again.'
    )
  }
}
