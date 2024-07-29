import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosProposalOperation extends TezosBaseOperation {
  kind: TezosOperationType.PROPOSALS
  period: string
  proposals: string[]
}
