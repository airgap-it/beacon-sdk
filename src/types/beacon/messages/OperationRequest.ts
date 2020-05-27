import { BeaconBaseMessage, BeaconMessageType, Network, TezosOperations } from '../../..'

export interface OperationRequest extends BeaconBaseMessage {
  type: BeaconMessageType.OperationRequest
  network: Network // Network on which the operation will be broadcast
  operationDetails: Partial<TezosOperations>[] // Partial TezosOperations that may lack certain information like counter and fee. Those will be added by the wallet.
  // TODO: OperationDetails has to be typed correctly
  sourceAddress: string
}
