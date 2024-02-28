import { TezosOperationType } from '../OperationTypes'
import { OperationContentsAndResultMetadata } from '../utils'

export interface VdfRevelationOperation {
  kind: TezosOperationType.VDF_REVELATION
  solution: string[]
  metadata: OperationContentsAndResultMetadata
}
