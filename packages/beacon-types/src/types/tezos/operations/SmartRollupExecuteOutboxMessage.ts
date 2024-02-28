import { TezosOperationType } from "../OperationTypes"

export interface SmartRollupExecuteOutboxMessageOperation {
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
