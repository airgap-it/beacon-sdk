import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationMetadataBalanceUpdates } from '../common'

export interface TezosPreAttestationOperation extends TezosBaseOperation {
  kind: TezosOperationType.PREATTESTATION
  slot: number
  level: number
  round: number
  block_payload_hash: string
}

export interface TezosPreAttestationResultOperation extends TezosPreAttestationOperation {
  metadata: OperationContentsAndResultMetadataPreattestation
}

export interface OperationContentsAndResultMetadataPreattestation {
  balance_updates?: OperationMetadataBalanceUpdates[]
  delegate: string
  consensus_power: number
  consensus_key?: string
}
