import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

/**
 * @category Message
 */
export interface AcknowledgeResponse extends BeaconBaseMessage {
  type: BeaconMessageType.Acknowledge
}
