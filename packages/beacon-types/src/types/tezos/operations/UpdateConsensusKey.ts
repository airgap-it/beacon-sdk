import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import {
  InternalOperationResult,
  OperationMetadataBalanceUpdates,
  OperationResultUpdateConsensusKey
} from '../common'

export interface TezosUpdateConsensusKeyOperation extends TezosBaseOperation {
  kind: TezosOperationType.UPDATE_CONSENSUS_KEY
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  pk: string
}

export interface TezosUpdateConsensusKeyResultOperation extends TezosUpdateConsensusKeyOperation {
  metadata: MetadataUpdateConsensusKeyOperation
}

export interface MetadataUpdateConsensusKeyOperation {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultUpdateConsensusKey
  internal_operation_results?: InternalOperationResult[]
}
