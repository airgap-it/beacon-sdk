import { TezosOperationType } from '../OperationTypes'
import { OperationContentsAndResultMetadata } from '../common'

export interface VdfRevelationOperation {
  kind: TezosOperationType.VDF_REVELATION
  solution: string[]
}

export interface VdfRevelationResultOperation extends VdfRevelationOperation {
  metadata: OperationContentsAndResultMetadata
}
