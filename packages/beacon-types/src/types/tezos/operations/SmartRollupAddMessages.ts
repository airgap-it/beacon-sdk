import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import {
  InternalOperationResult,
  OperationMetadataBalanceUpdates,
  OperationResultStatusEnum,
  TezosGenericOperationError
} from '../common'

export interface SmartRollupAddMessagesOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_ADD_MESSAGES
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  message: string[]
}

export interface SmartRollupAddMessagesResultOperation extends SmartRollupAddMessagesOperation {
  metadata: MetadataSmartRollupAddMessages
}

export interface MetadataSmartRollupAddMessages {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultSmartRollupAddMessages
  internal_operation_results?: InternalOperationResult[]
}

export interface OperationResultSmartRollupAddMessages {
  status: OperationResultStatusEnum
  consumed_milligas?: string
  errors?: TezosGenericOperationError[]
}
