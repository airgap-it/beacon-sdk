import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationContentsAndResultMetadataExtended0 } from '../common'
import { InlinedEndorsement } from './DoubleEndorsementEvidence'

export interface TezosEndorsementWithSlotOperation extends TezosBaseOperation {
  kind: TezosOperationType.ENDORSEMENT_WITH_SLOT
  endorsement: InlinedEndorsement
  slot: number
}

export interface TezosEndorsementWithSlotResultOperation extends TezosEndorsementWithSlotOperation {
  metadata: OperationContentsAndResultMetadataExtended0
}
