import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationMetadataBalanceUpdates } from '../common'

export interface DoublePreEndorsementEvidenceOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_PREENDORSEMENT_EVIDENCE
  op1: InlinedPreEndorsement
  op2: InlinedPreEndorsement
}

export interface DoublePreEndorsementEvidenceResultOperation
  extends DoublePreEndorsementEvidenceOperation {
  metadata: OperationContentsAndResultMetadata
}

export interface OperationContentsAndResultMetadata {
  balance_updates?: OperationMetadataBalanceUpdates[]
}

export interface InlinedPreEndorsement {
  branch: string
  operations: InlinedPreEndorsementContents
  signature?: string
}

export interface InlinedPreEndorsementContents {
  kind: TezosOperationType.PREENDORSEMENT
  slot: number
  level: number
  round: number
  block_payload_hash: string
}
