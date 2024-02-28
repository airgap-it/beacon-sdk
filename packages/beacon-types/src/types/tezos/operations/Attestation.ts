import { TezosOperationType } from '../OperationTypes'

export interface AttestationOperation {
  kind: TezosOperationType.ATTESTATION
  level: number
  slot?: number
  round?: number
  block_payload_hash?: string
}
