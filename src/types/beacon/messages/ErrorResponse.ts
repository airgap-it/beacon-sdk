import { BeaconBaseMessage, BeaconErrorType, BeaconMessageType } from '../../..'

/**
 * @category Message
 */
export interface ErrorResponse extends BeaconBaseMessage {
  type: BeaconMessageType.Error
  errorType: BeaconErrorType
  errorData?: any
}
