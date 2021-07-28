import { BeaconBaseMessage, BeaconMessageType } from '../../..'

/**
 * @category Message
 */
export interface DisconnectMessage extends BeaconBaseMessage {
  type: BeaconMessageType.Disconnect
}
