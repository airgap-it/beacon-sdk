import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosSmartRollupAddMessagesOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_ADD_MESSAGES
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  message: string[]
}
