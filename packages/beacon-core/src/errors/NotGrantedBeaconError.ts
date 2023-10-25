import { BeaconError } from '..'
import { BeaconErrorType } from '@mavrykdynamics/beacon-types'

/**
 * @category Error
 */
export class NotGrantedBeaconError extends BeaconError {
  public name: string = 'NotGrantedBeaconError'
  public title: string = 'Permission Not Granted'

  constructor() {
    super(
      BeaconErrorType.NOT_GRANTED_ERROR,
      'You do not have the necessary permissions to perform this action. Please initiate another permission request and give the necessary permissions.'
    )
  }
}
