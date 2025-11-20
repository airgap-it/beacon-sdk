import { BeaconErrorType } from '@airgap/beacon-types'

import { BEACON_ERROR_CODES } from './error-codes'
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
      'The wallet does not support this network. Please select another one.',
      BEACON_ERROR_CODES.NETWORK_NOT_SUPPORTED
    )
  }
}
