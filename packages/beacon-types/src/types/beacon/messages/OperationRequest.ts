import { BeaconBaseMessage, BeaconMessageType, Network } from '@mavrykdynamics/beacon-types'
import { PartialTezosOperation } from '../../tezos/PartialTezosOperation'

/**
 * @category Message
 */
export interface OperationRequest extends BeaconBaseMessage {
  type: BeaconMessageType.OperationRequest
  network: Network // Network on which the operation will be broadcast
  operationDetails: PartialTezosOperation[] // Partial TezosOperation that may lack certain information like counter and fee. Those will be added by the wallet.
  sourceAddress: string
}
