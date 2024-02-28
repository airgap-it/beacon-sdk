import { TezosOperationType } from '../OperationTypes'
import { OperationContentsAndResultMetadataExtended0 } from '../common'
import { InlinedEndorsement } from './DoubleEndorsementEvidence'

export interface EndorsementWithSlotOperation {
  kind: TezosOperationType.ENDORSEMENT_WITH_SLOT
  endorsement: InlinedEndorsement
  slot: number
}

export interface EndorsementWithSlotResultOperation {
  metadata: OperationContentsAndResultMetadataExtended0
}
