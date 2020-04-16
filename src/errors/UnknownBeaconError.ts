import { BeaconError, BeaconErrorType } from '..'

export class UnknownBeaconError extends BeaconError {
  public name: string = 'UnknownBeaconError'
  constructor() {
    super(
      BeaconErrorType.UNKNOWN_ERROR,
      'An unknown error occured. Please try again or report it to a developer.'
    )
  }
}
