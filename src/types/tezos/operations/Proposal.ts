import { TezosBaseOperation, TezosOperationType } from '../../..'

export interface TezosProposalOperation extends TezosBaseOperation {
  kind: TezosOperationType.PROPOSALS
  period: string
  proposals: string[]
}
