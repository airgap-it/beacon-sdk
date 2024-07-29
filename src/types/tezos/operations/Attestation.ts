import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosAttestationOperation extends TezosBaseOperation {
  kind: TezosOperationType.ATTESTATION
  level: number
  slot?: number
  round?: number
  block_payload_hash?: string
}
