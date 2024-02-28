import { InlinedAttestation } from '../InlinedAttestation'
import { TezosOperationType } from '../OperationTypes'

export interface AttestationWithSlotOperation {
  kind: TezosOperationType.ATTESTATION_WITH_SLOT
  endorsement: InlinedAttestation
  slot: number
}
