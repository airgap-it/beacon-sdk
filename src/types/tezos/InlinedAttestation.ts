import { TezosOperationType } from './TezosOperationType'

export interface InlinedAttestation {
  branch: string
  operations: InlinedAttestationContents
  signature?: string
}

export interface InlinedAttestationContents {
  kind: InlinedAttestationKindEnum
  slot?: number
  round?: number
  block_payload_hash?: string
  level: number
}

export type InlinedAttestationKindEnum = TezosOperationType.ATTESTATION
