import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import {
  OperationMetadataBalanceUpdates,
  InternalOperationResult,
  OperationBalanceUpdates,
  OperationResultStatusEnum,
  TezosGenericOperationError
} from '../common'

export interface TezosSmartRollupRecoverBondOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_RECOVER_BOND
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  staker: string
}

export interface TezosSmartRollupRecoverBondResultOperation
  extends TezosSmartRollupRecoverBondOperation {
  metadata: OperationContentsAndResultMetadataSmartRollupRecoverBond
}

export interface OperationContentsAndResultMetadataSmartRollupRecoverBond {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultSmartRollupRecoverBond
  internal_operation_results?: InternalOperationResult[]
}

export interface OperationResultSmartRollupRecoverBond {
  status: OperationResultStatusEnum
  balance_updates?: OperationBalanceUpdates
  consumed_milligas?: string
  errors?: TezosGenericOperationError[]
}
