import { TezosOperationType } from '../OperationTypes'
import {
  OperationMetadataBalanceUpdates,
  InternalOperationResult,
  OperationBalanceUpdates,
  OperationResultStatusEnum,
  TezosGenericOperationError
} from '../common'

export interface SmartRollupRecoverBondOperation {
  kind: TezosOperationType.SMART_ROLLUP_RECOVER_BOND
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  staker: string
}

export interface SmartRollupRecoverBondResultOperation extends SmartRollupRecoverBondOperation {
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
