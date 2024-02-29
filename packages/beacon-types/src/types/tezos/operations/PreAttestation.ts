import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationMetadataBalanceUpdates } from '../common'

export interface PreAttestationOperation extends TezosBaseOperation {
  kind: TezosOperationType.PREATTESTATION
  slot: number
  level: number
  round: number
  block_payload_hash: string
}

export interface PreAttestationResultOperation extends PreAttestationOperation {
  metadata: OperationContentsAndResultMetadataPreattestation
}

export interface OperationContentsAndResultMetadataPreattestation {
  balance_updates?: OperationMetadataBalanceUpdates[]
  delegate: string
  consensus_power: number
  consensus_key?: string
}
