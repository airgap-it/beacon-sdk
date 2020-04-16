import { BeaconBaseMessage, BeaconMessageType } from '../../..'

export interface BroadcastResponse extends BeaconBaseMessage {
  type: BeaconMessageType.BroadcastResponse
  transactionHash: string // Hash of the broadcast transaction
}
