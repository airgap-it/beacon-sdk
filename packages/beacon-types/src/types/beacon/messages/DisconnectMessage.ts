import { BeaconBaseMessage, BeaconMessageType } from '@mavrykdynamics/beacon-types'

/**
 * @category Message
 */
export interface DisconnectMessage extends BeaconBaseMessage {
  type: BeaconMessageType.Disconnect
}
