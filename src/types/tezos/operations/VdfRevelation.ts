import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosVdfRevelationOperation extends TezosBaseOperation {
  kind: TezosOperationType.VDF_REVELATION
  solution: string[]
}
