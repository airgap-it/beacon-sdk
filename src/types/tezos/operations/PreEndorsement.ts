import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosPreEndorsementOperation extends TezosBaseOperation {
  kind: TezosOperationType.PREENDORSEMENT
  slot: number
  level: number
  round: number
  block_payload_hash: string
}
