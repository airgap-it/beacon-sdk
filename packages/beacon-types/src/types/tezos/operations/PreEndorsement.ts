import { TezosOperationType } from '../OperationTypes'

export interface PreEndorsementOperation {
  kind: TezosOperationType.PREENDORSEMENT
  slot: number
  level: number
  round: number
  block_payload_hash: string
}
