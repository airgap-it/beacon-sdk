import { InlinedAttestation } from '../InlinedAttestation'
import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationContentsAndResultMetadataExtended1 } from '../common'

export interface TezosAttestationWithSlotOperation extends TezosBaseOperation {
  kind: TezosOperationType.ATTESTATION_WITH_SLOT
  endorsement: InlinedAttestation
  slot: number
}

export interface TezosAttestationWithSlotResultOperation extends TezosAttestationWithSlotOperation {
  metadata: OperationContentsAndResultMetadataExtended1
}
