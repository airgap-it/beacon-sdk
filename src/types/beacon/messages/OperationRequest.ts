import { BeaconBaseMessage, BeaconMessageType, Network } from '../../..'
import { PartialTezosOperation } from '../../tezos/PartialTezosOperation'

export interface OperationRequest extends BeaconBaseMessage {
  type: BeaconMessageType.OperationRequest
  network: Network // Network on which the operation will be broadcast
  operationDetails: PartialTezosOperation[] // Partial TezosOperation that may lack certain information like counter and fee. Those will be added by the wallet.
  sourceAddress: string
}
