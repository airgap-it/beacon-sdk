import { TezosOperationType } from '../OperationTypes'

export interface DrainDelegateOperation {
  kind: TezosOperationType.DRAIN_DELEGATE
  consensus_key: string
  delegate: string
  destination: string
}
