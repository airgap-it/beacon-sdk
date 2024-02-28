import { TezosOperationType } from '../OperationTypes'
import { OperationMetadataBalanceUpdates } from '../common'

export interface PreAttestationOperation {
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
