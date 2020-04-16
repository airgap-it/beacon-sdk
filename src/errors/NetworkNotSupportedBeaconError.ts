import { BeaconError, BeaconErrorType } from '..'

export class NetworkNotSupportedBeaconError extends BeaconError {
  public name: string = 'NetworkNotSupportedBeaconError'
  constructor() {
    super(
      BeaconErrorType.NETWORK_NOT_SUPPORTED,
      'The wallet does not support this network. Please chose another one.'
    )
  }
}
