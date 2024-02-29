import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationContentsAndResultMetadata } from '../common'

export interface VdfRevelationOperation extends TezosBaseOperation {
  kind: TezosOperationType.VDF_REVELATION
  solution: string[]
}

export interface VdfRevelationResultOperation extends VdfRevelationOperation {
  metadata: OperationContentsAndResultMetadata
}
