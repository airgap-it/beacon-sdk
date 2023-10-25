import { BeaconError } from '..'
import { BeaconErrorType } from '@mavrykdynamics/beacon-types'

/**
 * @category Error
 */
export class NoAddressBeaconError extends BeaconError {
  public name: string = 'NoAddressBeaconError'
  public title: string = 'No Address'

  constructor() {
    super(
      BeaconErrorType.NO_ADDRESS_ERROR,
      'The wallet does not have an account set up. Please make sure to set up your wallet and try again.'
    )
  }
}
