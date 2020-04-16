import { BeaconError, BeaconErrorType } from '..'

export class NoAddressBeaconError extends BeaconError {
  public name: string = 'NoAddressBeaconError'
  constructor() {
    super(
      BeaconErrorType.NO_ADDRESS_ERROR,
      'The wallet does not have an account set up. Please make sure to set up your wallet and try again.'
    )
  }
}
