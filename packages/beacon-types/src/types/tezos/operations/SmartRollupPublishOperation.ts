import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import {
  InternalOperationResult,
  OperationBalanceUpdates,
  OperationMetadataBalanceUpdates,
  OperationResultStatusEnum,
  SmartRollupPublishCommitment,
  TezosGenericOperationError
} from '../common'

export interface SmartRollupPublishOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_PUBLISH
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  commitment: SmartRollupPublishCommitment
}

export interface SmartRollupPublishResultOperation extends SmartRollupPublishOperation {
  metadata: MetadataSmartRollupPublish
}

export interface MetadataSmartRollupPublish {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultSmartRollupPublish
  internal_operation_results?: InternalOperationResult[]
}

export interface OperationResultSmartRollupPublish {
  status: OperationResultStatusEnum
  consumed_milligas?: string
  staked_hash?: string
  published_at_level?: number
  balance_updates?: OperationBalanceUpdates
  errors?: TezosGenericOperationError[]
}
