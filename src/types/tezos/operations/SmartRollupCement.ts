import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosSmartRollupCementOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_CEMENT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
}
