import { InlinedPreattestation } from '../InlinedPreattestation'
import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationContentsAndResultMetadata } from '../common'

export interface DoublePreAttestationOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_PREATTESTATION_EVIDENCE
  op1: InlinedPreattestation
  op2: InlinedPreattestation
  metadata: OperationContentsAndResultMetadata
}
