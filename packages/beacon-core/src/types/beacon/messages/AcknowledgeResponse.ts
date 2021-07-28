import { BeaconBaseMessage, BeaconMessageType } from '../../..'

/**
 * @category Message
 */
export interface AcknowledgeResponse extends BeaconBaseMessage {
  type: BeaconMessageType.Acknowledge
}
