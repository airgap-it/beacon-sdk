import { BeaconError, BeaconErrorType } from '..'

export class ParametersInvalidBeaconError extends BeaconError {
  public name: string = 'ParametersInvalidBeaconError'
  public title: string = 'Parameters Invalid'

  constructor() {
    super(
      BeaconErrorType.PARAMETERS_INVALID_ERROR,
      'Some of the parameters you provided are invalid and the request could not be completed. Please check your inputs and try again.'
    )
  }
}
