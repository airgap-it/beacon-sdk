import { MichelineMichelsonV1Expression } from '../MichelineMichelsonV1Expression'
import { TezosOperationType } from '../OperationTypes'
import {
  InternalOperationResult,
  OperationMetadataBalanceUpdates,
  OperationResultRegisterGlobalConstant
} from '../common'

export interface RegisterGlobalConstantOperation {
  kind: TezosOperationType.REGISTER_GLOBAL_CONSTANT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  value: MichelineMichelsonV1Expression
}

export interface RegisterGlobalConstantResultOperation {
  metadata: OperationContentsAndResultMetadataRegisterGlobalConstant
}

export interface OperationContentsAndResultMetadataRegisterGlobalConstant {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultRegisterGlobalConstant
  internal_operation_results?: InternalOperationResult[]
}
