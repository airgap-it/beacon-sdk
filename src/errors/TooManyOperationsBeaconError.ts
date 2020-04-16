import { BeaconError, BeaconErrorType } from '..'

export class TooManyOperationsBeaconError extends BeaconError {
  public name: string = 'TooManyOperationsBeaconError'
  constructor() {
    super(
      BeaconErrorType.TOO_MANY_OPERATIONS,
      'The request contains too many transactions. Please include fewer operations and try again.'
    )
  }
}
