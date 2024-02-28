import { TezosOperationType } from '../OperationTypes'

export interface DoublePreEndorsementOperation {
  kind: TezosOperationType.DOUBLE_PREENDORSEMENT_EVIDENCE
  op1: InlinedPreEndorsement
  op2: InlinedPreEndorsement
}

export interface InlinedPreEndorsement {
  branch: string
  operations: InlinedPreEndorsementContents
  signature?: string
}

export interface InlinedPreEndorsementContents {
  kind: TezosOperationType.PREENDORSEMENT
  slot: number
  level: number
  round: number
  block_payload_hash: string
}
