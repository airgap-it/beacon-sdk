import { TezosOperationType } from './TezosOperationType'

export interface InlinedPreattestation {
  branch: string
  operations: InlinedPreattestationContents
  signature?: string
}

export interface InlinedPreattestationContents {
  kind: TezosOperationType.PREATTESTATION
  slot: number
  level: number
  round: number
  block_payload_hash: string
}
