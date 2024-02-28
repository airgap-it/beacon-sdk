import { TezosOperationType } from '../OperationTypes'
import { OperationMetadataBalanceUpdates } from '../common'

export interface PreEndorsementOperation {
  kind: TezosOperationType.PREENDORSEMENT
  slot: number
  level: number
  round: number
  block_payload_hash: string
}

export interface PreEndorsementResultOperation extends PreEndorsementOperation {
  metadata: OperationContentsAndResultMetadataPreEndorsement
}

export interface OperationContentsAndResultMetadataPreEndorsement {
  balance_updates?: OperationMetadataBalanceUpdates[]
  delegate: string
  preendorsement_power: number
  consensus_key?: string
}
