import { BeaconBaseMessage, BeaconMessageType, Network, TezosOperation } from '../../..'

export interface OperationRequest extends BeaconBaseMessage {
  type: BeaconMessageType.OperationRequest
  network: Network // Network on which the operation will be broadcast
  operationDetails: Partial<TezosOperation>[] // Partial TezosOperation that may lack certain information like counter and fee. Those will be added by the wallet.
  sourceAddress: string
}
