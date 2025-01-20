import { TezosBaseOperation, TezosOperationType } from '../../..'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosBallotOperation extends TezosBaseOperation {
  kind: TezosOperationType.BALLOT
  source: string
  period: number
  proposal: string
  ballot: 'nay' | 'yay' | 'pass'
}
