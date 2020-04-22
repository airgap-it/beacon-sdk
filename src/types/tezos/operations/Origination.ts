import { TezosBaseOperation, TezosOperationType } from '../../..'

export interface TezosOriginationOperation extends TezosBaseOperation {
  kind: TezosOperationType.DELEGATION
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  balance: string
  delegate?: string
  script: string
}
