import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosDrainDelegateOperation extends TezosBaseOperation {
  kind: TezosOperationType.DRAIN_DELEGATE
  consensus_key: string
  delegate: string
  destination: string
}
