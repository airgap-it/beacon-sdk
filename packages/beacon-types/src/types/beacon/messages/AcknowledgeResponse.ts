import { BeaconBaseMessage, BeaconMessageType } from '@mavrykdynamics/beacon-types'

/**
 * @category Message
 */
export interface AcknowledgeResponse extends BeaconBaseMessage {
  type: BeaconMessageType.Acknowledge
}
