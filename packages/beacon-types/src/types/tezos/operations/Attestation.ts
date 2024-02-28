import { TezosOperationType } from '../OperationTypes'
import { OperationContentsAndResultMetadataExtended1 } from '../common'

export interface AttestationOperation {
  kind: TezosOperationType.ATTESTATION
  level: number
  slot?: number
  round?: number
  block_payload_hash?: string
}

export interface AttestationResultOperation extends AttestationOperation {
  metadata: OperationContentsAndResultMetadataExtended1
}
