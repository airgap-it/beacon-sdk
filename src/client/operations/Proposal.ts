import { TezosOperation, TezosOperationType } from './OperationTypes'

export interface TezosProposalOperation extends TezosOperation {
  kind: TezosOperationType.PROPOSALS
  period: string
  proposals: string[]
}
