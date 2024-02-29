import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import {
  InternalOperationResult,
  OperationMetadataBalanceUpdates,
  OperationResultSetDepositsLimit
} from '../common'

export interface TezosSetDepositsLimitOperation extends TezosBaseOperation {
  kind: TezosOperationType.SET_DEPOSITS_LIMIT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  limit?: string
}

export interface TezosSetDepositsLimitResultOperation extends TezosSetDepositsLimitOperation {
  metadata: OperationContentsAndResultMetadataSetDepositsLimit
}

export interface OperationContentsAndResultMetadataSetDepositsLimit {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultSetDepositsLimit
  internal_operation_results?: InternalOperationResult[]
}
