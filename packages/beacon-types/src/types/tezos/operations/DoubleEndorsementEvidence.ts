import { TezosBaseOperation, TezosOperationType } from '../../..'

export interface InlinedEndorsement {
  branch: string
  operations: InlinedEndorsementContents
  signature?: string
}

export interface InlinedEndorsementContents extends TezosBaseOperation {
  kind: TezosOperationType.ENDORSEMENT
  level: string
  slot?: number
  round?: number
  block_payload_hash?: string
}

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosDoubleEndorsementEvidenceOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_ENDORSEMENT_EVIDENCE
  op1: InlinedEndorsement
  op2: InlinedEndorsement
}
