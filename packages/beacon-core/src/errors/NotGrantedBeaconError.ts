import { BeaconErrorType } from '@airgap/beacon-types'

import { BEACON_ERROR_CODES } from './error-codes'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class NotGrantedBeaconError extends BeaconError {
  public name: string = 'NotGrantedBeaconError'
  public title: string = 'Permission Not Granted'

  constructor() {
    super(
      BeaconErrorType.NOT_GRANTED_ERROR,
      'You do not have the necessary permissions to perform this action. Please initiate another permission request and give the necessary permissions.',
      BEACON_ERROR_CODES.PERMISSION_DENIED
    )
  }
}
