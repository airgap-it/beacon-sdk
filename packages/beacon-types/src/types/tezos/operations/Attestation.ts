import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationContentsAndResultMetadataExtended1 } from '../common'

export interface TezosAttestationOperation extends TezosBaseOperation {
  kind: TezosOperationType.ATTESTATION
  level: number
  slot?: number
  round?: number
  block_payload_hash?: string
}

export interface TezosAttestationResultOperation extends TezosAttestationOperation {
  metadata: OperationContentsAndResultMetadataExtended1
}
