import { TezosOperation, TezosOperationType } from '../../..'

export interface TezosEndorsementOperation extends TezosOperation {
  kind: TezosOperationType.ENDORSEMENT
  level: string
}
