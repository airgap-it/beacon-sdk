import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

/**
 * @category Message
 */
export interface BroadcastResponse extends BeaconBaseMessage {
  type: BeaconMessageType.BroadcastResponse
  transactionHash: string // Hash of the broadcast transaction
}
