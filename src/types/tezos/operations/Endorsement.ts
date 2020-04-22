import { TezosBaseOperation, TezosOperationType } from '../../..'

export interface TezosEndorsementOperation extends TezosBaseOperation {
  kind: TezosOperationType.ENDORSEMENT
  level: string
}
