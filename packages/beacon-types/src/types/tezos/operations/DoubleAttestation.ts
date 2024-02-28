import { InlinedAttestation } from '../InlinedAttestation'
import { TezosOperationType } from '../OperationTypes'

export interface DoubleAttestationOperation {
  kind: TezosOperationType.DOUBLE_ATTESTATION_EVIDENCE
  op1: InlinedAttestation
  op2: InlinedAttestation
  slot?: number
}
