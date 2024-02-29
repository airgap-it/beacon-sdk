import { MichelineMichelsonV1Expression } from '../MichelineMichelsonV1Expression'
import { TezosOperationType } from '../OperationTypes'
import {
  InternalOperationResult,
  OperationBalanceUpdates,
  OperationMetadataBalanceUpdates,
  OperationResultStatusEnum,
  PvmKind,
  TezosGenericOperationError
} from '../common'

export interface SmartRollupOriginateOperation {
  kind: TezosOperationType.SMART_ROLLUP_ORIGINATE
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  pvm_kind: PvmKind
  kernel: string
  parameters_ty: MichelineMichelsonV1Expression
  whitelist?: string[]
}

export interface SmartRollupOriginateResultOperation extends SmartRollupOriginateOperation {
  metadata: MetadataSmartRollupOriginate
}

export interface MetadataSmartRollupOriginate {
  balance_updates?: OperationMetadataBalanceUpdates[]
  operation_result: OperationResultSmartRollupOriginate
  internal_operation_results?: InternalOperationResult[]
}

export interface OperationResultSmartRollupOriginate {
  status: OperationResultStatusEnum
  balance_updates?: OperationBalanceUpdates
  address?: string
  genesis_commitment_hash?: string
  consumed_milligas?: string
  size?: string
  errors?: TezosGenericOperationError[]
}
