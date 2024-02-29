import { TezosOperationType } from '../OperationTypes'
import { OperationMetadataBalanceUpdates } from '../common'

export interface DrainDelegateOperation {
  kind: TezosOperationType.DRAIN_DELEGATE
  consensus_key: string
  delegate: string
  destination: string
}

export interface DrainDelegateResultOperation extends DrainDelegateOperation {
  metadata: MetadataDrainDelegate
}

export interface MetadataDrainDelegate {
  balance_updates?: OperationMetadataBalanceUpdates[]
  allocated_destination_contract?: boolean
}
