import { InlinedPreattestation } from '../InlinedPreattestation'
import { TezosOperationType } from '../OperationTypes'
import { OperationContentsAndResultMetadata } from '../common'

export interface DoublePreAttestationOperation {
  kind: TezosOperationType.DOUBLE_PREATTESTATION_EVIDENCE
  op1: InlinedPreattestation
  op2: InlinedPreattestation
  metadata: OperationContentsAndResultMetadata
}
