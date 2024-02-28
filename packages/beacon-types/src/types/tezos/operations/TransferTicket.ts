import { MichelineMichelsonV1Expression } from '../MichelineMichelsonV1Expression'
import { TezosOperationType } from '../OperationTypes'
import {
  InternalOperationResult,
  OperationBalanceUpdates,
  OperationMetadataBalanceUpdates,
  OperationResultStatusEnum,
  TezosGenericOperationError,
  TicketUpdates
} from '../common'

export interface TransferTicketOperation {
  kind: TezosOperationType.TRANSFER_TICKET
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  ticket_contents: MichelineMichelsonV1Expression
  ticket_ty: MichelineMichelsonV1Expression
  ticket_ticketer: string
  ticket_amount: string
  destination: string
  entrypoint: string
}

export interface TransferTicketResultOperation extends TransferTicketOperation {
  metadata: MetadataTransferTicket
}

export interface MetadataTransferTicket {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultTransferTicket
  internal_operation_results?: InternalOperationResult[]
}

export interface OperationResultTransferTicket {
  status: OperationResultStatusEnum
  balance_updates?: OperationBalanceUpdates
  ticket_updates?: TicketUpdates[]
  consumed_milligas?: string
  paid_storage_size_diff?: string
  errors?: TezosGenericOperationError[]
}
