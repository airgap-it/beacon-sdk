import { TezosOperationType } from '../OperationTypes'

export interface SetDepositsLimitOperation {
  kind: TezosOperationType.SET_DEPOSITS_LIMIT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  limit?: string
}
