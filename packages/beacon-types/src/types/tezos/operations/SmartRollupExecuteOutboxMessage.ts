import { TezosOperationType } from '../OperationTypes'
import {
  InternalOperationResult,
  OperationBalanceUpdates,
  OperationMetadataBalanceUpdates,
  OperationResultStatusEnum,
  TezosGenericOperationError,
  TicketUpdates
} from '../common'

export interface SmartRollupExecuteOutboxMessageOperation {
  kind: TezosOperationType.SMART_ROLLUP_EXECUTE_OUTBOX_MESSAGE
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  cemented_commitment: string
  output_proof: string
}

export interface SmartRollupExecuteOutboxMessageResultOperation
  extends SmartRollupExecuteOutboxMessageOperation {
  metadata: MetadataSmartRollupExecuteOutboxMessage
}

export interface MetadataSmartRollupExecuteOutboxMessage {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultSmartRollupExecuteOutboxMessage
  internal_operation_results?: InternalOperationResult[]
}

export interface OperationResultSmartRollupExecuteOutboxMessage {
  status: OperationResultStatusEnum
  balance_updates?: OperationBalanceUpdates
  ticket_updates?: TicketUpdates[]
  consumed_milligas?: string
  paid_storage_size_diff?: string
  errors?: TezosGenericOperationError[]
}
