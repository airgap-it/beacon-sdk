import { BeaconBaseMessage, BeaconMessageType } from '../../..'

export interface DisconnectMessage extends BeaconBaseMessage {
  type: BeaconMessageType.Disconnect
}
