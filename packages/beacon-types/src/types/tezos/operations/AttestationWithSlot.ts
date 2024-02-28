import { InlinedAttestation } from '../InlinedAttestation'
import { TezosOperationType } from '../OperationTypes'
import { OperationContentsAndResultMetadataExtended1 } from '../common'

export interface AttestationWithSlotOperation {
  kind: TezosOperationType.ATTESTATION_WITH_SLOT
  endorsement: InlinedAttestation
  slot: number
}

export interface AttestationWithSlotResultOperation extends AttestationWithSlotOperation {
  metadata: OperationContentsAndResultMetadataExtended1
}
