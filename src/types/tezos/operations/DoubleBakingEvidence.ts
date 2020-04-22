import { TezosBaseOperation, TezosOperationType, TezosBlockHeader } from '../../..'

export interface InlinedEndorsement {
  branch: string
  operations: InlinedEndorsementContents
  signature?: string
}

export interface InlinedEndorsementContents {
  kind: 'endorsement'
  level: string
}

export interface TezosDoubleBakingEvidenceOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_BAKING_EVIDENCE
  bh1: TezosBlockHeader
  bh2: TezosBlockHeader
}
