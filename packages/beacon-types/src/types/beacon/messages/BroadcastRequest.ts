import { BeaconBaseMessage, BeaconMessageType, Network } from '@airgap/beacon-types'

/**
 * @category Message
 */
export interface BroadcastRequest extends BeaconBaseMessage {
  type: BeaconMessageType.BroadcastRequest
  network: Network // Network on which the transaction will be broadcast
  signedTransaction: string // Signed transaction that will be broadcast
}
