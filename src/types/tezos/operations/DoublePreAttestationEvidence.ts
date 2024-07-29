import { InlinedPreattestation } from '../InlinedPreattestation'
import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosDoublePreAttestationEvidenceOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_PREATTESTATION_EVIDENCE
  op1: InlinedPreattestation
  op2: InlinedPreattestation
}
