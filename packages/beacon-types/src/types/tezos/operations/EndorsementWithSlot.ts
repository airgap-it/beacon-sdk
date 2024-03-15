import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { InlinedEndorsement } from './DoubleEndorsementEvidence'

export interface TezosEndorsementWithSlotOperation extends TezosBaseOperation {
  kind: TezosOperationType.ENDORSEMENT_WITH_SLOT
  endorsement: InlinedEndorsement
  slot: number
}