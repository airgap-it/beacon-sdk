import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosSmartRollupExecuteOutboxMessageOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_EXECUTE_OUTBOX_MESSAGE
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  cemented_commitment: string
  output_proof: string
}
