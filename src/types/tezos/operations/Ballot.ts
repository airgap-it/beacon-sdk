import { TezosBaseOperation, TezosOperationType } from '../../..'

export interface TezosBallotOperation extends TezosBaseOperation {
  kind: TezosOperationType.BALLOT
  source: string
  period: string
  proposal: string
  ballot: 'nay' | 'yay' | 'pass'
}
