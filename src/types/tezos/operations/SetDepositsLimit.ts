import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosSetDepositsLimitOperation extends TezosBaseOperation {
  kind: TezosOperationType.SET_DEPOSITS_LIMIT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  limit?: string
}
