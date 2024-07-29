import { MichelineMichelsonV1Expression } from '../MichelineMichelsonV1Expression'
import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosRegisterGlobalConstantOperation extends TezosBaseOperation {
  kind: TezosOperationType.REGISTER_GLOBAL_CONSTANT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  value: MichelineMichelsonV1Expression
}
