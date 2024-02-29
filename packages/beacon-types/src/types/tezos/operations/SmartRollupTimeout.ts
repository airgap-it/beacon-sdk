import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import {
  OperationMetadataBalanceUpdates,
  InternalOperationResult,
  OperationBalanceUpdates,
  OperationResultStatusEnum,
  TezosGenericOperationError
} from '../common'
import { SmartRollupGameStatus } from './SmartRollupRefute'

export interface TezosSmartRollupTimeoutOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_TIMEOUT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  stakers: SmartRollupTimeoutStakers
}

export interface TezosSmartRollupTimeoutResultOperation extends TezosSmartRollupTimeoutOperation {
  metadata: OperationContentsAndResultMetadataSmartRollupTimeout
}

export interface SmartRollupTimeoutStakers {
  alice: string
  bob: string
}

export interface OperationContentsAndResultMetadataSmartRollupTimeout {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultSmartRollupTimeout
  internal_operation_results?: InternalOperationResult[]
}

export interface OperationResultSmartRollupTimeout {
  status: OperationResultStatusEnum
  consumed_milligas?: string
  game_status?: SmartRollupGameStatus
  balance_updates?: OperationBalanceUpdates
  errors?: TezosGenericOperationError[]
}
