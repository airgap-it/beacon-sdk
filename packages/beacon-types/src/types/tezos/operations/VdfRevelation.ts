import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationContentsAndResultMetadata } from '../common'

export interface TezosVdfRevelationOperation extends TezosBaseOperation {
  kind: TezosOperationType.VDF_REVELATION
  solution: string[]
}

export interface TezosVdfRevelationResultOperation extends TezosVdfRevelationOperation {
  metadata: OperationContentsAndResultMetadata
}
