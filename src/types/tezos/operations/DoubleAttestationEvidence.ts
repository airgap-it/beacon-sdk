import { InlinedAttestation } from '../InlinedAttestation'
import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosDoubleAttestationEvidenceOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_ATTESTATION_EVIDENCE
  op1: InlinedAttestation
  op2: InlinedAttestation
  slot?: number
}
