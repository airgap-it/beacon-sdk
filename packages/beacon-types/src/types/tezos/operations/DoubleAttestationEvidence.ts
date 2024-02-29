import { InlinedAttestation } from '../InlinedAttestation'
import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationContentsAndResultMetadata } from '../common'

export interface DoubleAttestationEvidenceOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_ATTESTATION_EVIDENCE
  op1: InlinedAttestation
  op2: InlinedAttestation
  slot?: number
}

export interface DoubleAttestationEvidenceResultOperation
  extends DoubleAttestationEvidenceOperation {
  metadata: OperationContentsAndResultMetadata
}
