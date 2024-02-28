import { TezosOperationType } from '../OperationTypes'
import { InlinedEndorsement } from './DoubleEndorsementEvidence'

export interface EndorsementWithSlotOperation {
  kind: TezosOperationType.ENDORSEMENT_WITH_SLOT
  endorsement: InlinedEndorsement
  slot: number
}
