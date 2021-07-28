import { TezosBaseOperation, TezosOperationType } from '../../..'

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
