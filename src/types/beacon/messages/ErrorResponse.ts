import { BeaconBaseMessage, BeaconErrorType, BeaconMessageType } from '../../..'

export interface ErrorResponse extends BeaconBaseMessage {
  type: BeaconMessageType.Error
  errorType: BeaconErrorType
}
