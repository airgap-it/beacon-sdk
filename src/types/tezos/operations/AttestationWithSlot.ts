import { InlinedAttestation } from '../InlinedAttestation'
import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosAttestationWithSlotOperation extends TezosBaseOperation {
  kind: TezosOperationType.ATTESTATION_WITH_SLOT
  endorsement: InlinedAttestation
  slot: number
}
