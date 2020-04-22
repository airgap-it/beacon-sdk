import { TezosBaseOperation, TezosOperationType } from '../../..'

export interface TezosDelegationOperation extends TezosBaseOperation {
  kind: TezosOperationType.DELEGATION
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  delegate?: string
}
