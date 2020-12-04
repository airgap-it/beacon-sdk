import { BeaconBaseMessage, BeaconMessageType } from '../../..'

export interface AcknowledgeResponse extends BeaconBaseMessage {
  type: BeaconMessageType.Acknowledge
}
