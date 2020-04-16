import { BeaconBaseMessage, BeaconMessageType } from '../../..'

export interface OperationResponse extends BeaconBaseMessage {
  type: BeaconMessageType.OperationResponse
  transactionHash: string // Hash of the broadcast transaction
}
