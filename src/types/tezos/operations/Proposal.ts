import { TezosBaseOperation, TezosOperationType } from '../../..'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosProposalOperation extends TezosBaseOperation {
  kind: TezosOperationType.PROPOSALS
  period: string
  proposals: string[]
}
