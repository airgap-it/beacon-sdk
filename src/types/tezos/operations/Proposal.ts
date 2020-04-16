import { TezosOperation, TezosOperationType } from '../../..'

export interface TezosProposalOperation extends TezosOperation {
  kind: TezosOperationType.PROPOSALS
  period: string
  proposals: string[]
}
