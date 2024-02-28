import { TezosOperationType } from '../OperationTypes'
import {
  InternalOperationResult,
  OperationMetadataBalanceUpdates,
  OperationResultUpdateConsensusKey
} from '../utils'

export interface UpdateConsensusKeyOperation {
  kind: TezosOperationType.UPDATE_CONSENSUS_KEY
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  pk: string
  metadata: MetadataUpdateConsensusKeyOperation
}

export interface MetadataUpdateConsensusKeyOperation {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultUpdateConsensusKey
  internal_operation_results?: InternalOperationResult[]
}
