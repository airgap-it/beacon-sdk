import { BeaconErrorType } from '@airgap/beacon-types'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class NetworkNotSupportedBeaconError extends BeaconError {
  public name: string = 'NetworkNotSupportedBeaconError'
  public title: string = 'Network Error'

  constructor() {
    super(
      BeaconErrorType.NETWORK_NOT_SUPPORTED,
      'The wallet does not support this network. Please select another one.'
    )
  }
}
