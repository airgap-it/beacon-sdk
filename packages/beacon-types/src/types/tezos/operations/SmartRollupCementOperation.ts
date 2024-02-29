import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import {
  InternalOperationResult,
  OperationMetadataBalanceUpdates,
  OperationResultStatusEnum,
  TezosGenericOperationError
} from '../common'

export interface SmartRollupCementOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_CEMENT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  metadata: MetadataSmartRollupCement
}

export interface SmartRollupCementResultOperation extends SmartRollupCementOperation {
  metadata: MetadataSmartRollupCement
}

export interface MetadataSmartRollupCement {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: SmartRollupCement
  internal_operation_results?: InternalOperationResult[]
}

export interface SmartRollupCement {
  status: OperationResultStatusEnum
  consumed_milligas?: string
  inbox_level?: number
  commitment_hash?: string
  errors?: TezosGenericOperationError[]
}
