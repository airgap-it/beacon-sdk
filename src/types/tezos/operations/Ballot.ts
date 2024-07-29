import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosBallotOperation extends TezosBaseOperation {
  kind: TezosOperationType.BALLOT
  source: string
  period: string
  proposal: string
  ballot: 'nay' | 'yay' | 'pass'
}
