import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationMetadataBalanceUpdates } from '../common'

export interface PreEndorsementOperation extends TezosBaseOperation {
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
