import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

/**
 * @category Message
 */
export interface OperationResponse extends BeaconBaseMessage {
  type: BeaconMessageType.OperationResponse
  operationHash: string // Hash of the broadcast transaction
}
