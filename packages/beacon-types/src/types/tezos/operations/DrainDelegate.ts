import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'
import { OperationMetadataBalanceUpdates } from '../common'

export interface TezosDrainDelegateOperation extends TezosBaseOperation {
  kind: TezosOperationType.DRAIN_DELEGATE
  consensus_key: string
  delegate: string
  destination: string
}

export interface TezosDrainDelegateResultOperation extends TezosDrainDelegateOperation {
  metadata: MetadataDrainDelegate
}

export interface MetadataDrainDelegate {
  balance_updates?: OperationMetadataBalanceUpdates[]
  allocated_destination_contract?: boolean
}
