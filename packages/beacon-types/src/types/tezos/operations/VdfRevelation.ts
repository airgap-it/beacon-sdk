import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosVdfRevelationOperation extends TezosBaseOperation {
  kind: TezosOperationType.VDF_REVELATION
  solution: string[]
}
