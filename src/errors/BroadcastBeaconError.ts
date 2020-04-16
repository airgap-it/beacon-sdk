import { BeaconError, BeaconErrorType } from '..'

export class BroadcastBeaconError extends BeaconError {
  public name: string = 'BroadcastBeaconError'
  constructor() {
    super(
      BeaconErrorType.BROADCAST_ERROR,
      'The transaction could not be broadcast to the network. Please try again.'
    )
  }
}
