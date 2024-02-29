import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import {
  InternalOperationResult,
  OperationBalanceUpdates,
  OperationMetadataBalanceUpdates,
  OperationResultStatusEnum,
  TezosGenericOperationError
} from '../common'

export interface TezosIncreasePaidStorageOperation extends TezosBaseOperation {
  kind: TezosOperationType.INCREASE_PAID_STORAGE
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  amount: string
  destination: string
}

export interface IncreasePaidStorageResultOperation extends TezosIncreasePaidStorageOperation {
  metadata: MetadataIncreasePaidStorage
}

export interface MetadataIncreasePaidStorage {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultIncreasePaidStorage
  internal_operation_results?: InternalOperationResult[]
}

export interface OperationResultIncreasePaidStorage {
  status: OperationResultStatusEnum
  balance_updates?: OperationBalanceUpdates
  consumed_milligas?: string
  errors?: TezosGenericOperationError[]
}
