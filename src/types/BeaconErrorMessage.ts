import { BeaconBaseMessage, BeaconErrorType } from '..'

export interface BeaconErrorMessage extends BeaconBaseMessage {
  errorType: BeaconErrorType
}
