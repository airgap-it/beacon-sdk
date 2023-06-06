import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

/**
 * @category Message
 */
export interface BroadcastResponse extends BeaconBaseMessage {
  type: BeaconMessageType.BroadcastResponse
  operationHash: string // Hash of the broadcast transaction
}
