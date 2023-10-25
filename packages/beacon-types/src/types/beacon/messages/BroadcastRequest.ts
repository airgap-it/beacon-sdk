import { BeaconBaseMessage, BeaconMessageType, Network } from '@mavrykdynamics/beacon-types'

/**
 * @category Message
 */
export interface BroadcastRequest extends BeaconBaseMessage {
  type: BeaconMessageType.BroadcastRequest
  network: Network // Network on which the transaction will be broadcast
  signedTransaction: string // Signed transaction that will be broadcast
}
