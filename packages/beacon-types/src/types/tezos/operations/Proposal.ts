import { TezosBaseOperation, TezosOperationType } from '../../..'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosProposalOperation extends TezosBaseOperation {
  kind: TezosOperationType.PROPOSALS
  source: string
  period: string
  proposals: string[]
}
