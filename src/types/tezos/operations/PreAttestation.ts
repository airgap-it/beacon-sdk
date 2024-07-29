import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosPreAttestationOperation extends TezosBaseOperation {
  kind: TezosOperationType.PREATTESTATION
  slot: number
  level: number
  round: number
  block_payload_hash: string
}
