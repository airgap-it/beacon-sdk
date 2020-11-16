import { BeaconBaseMessage, BeaconMessageType } from '../../..'

export interface AcknowledgeMessage extends BeaconBaseMessage {
  type: BeaconMessageType.Acknowledge
}
