import { BeaconError } from '..'
import { BeaconErrorType } from '@mavrykdynamics/beacon-types'

/**
 * @category Error
 */
export class NoPrivateKeyBeaconError extends BeaconError {
  public name: string = 'NoPrivateKeyBeaconError'
  public title: string = 'Account Not Found'

  constructor() {
    super(
      BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR,
      'The account you are trying to interact with is not available. Please make sure to add the account to your wallet and try again.'
    )
  }
}
