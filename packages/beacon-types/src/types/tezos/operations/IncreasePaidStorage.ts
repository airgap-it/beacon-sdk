import { TezosOperationType } from '../OperationTypes'

export interface IncreasePaidStorageOperation {
  kind: TezosOperationType.INCREASE_PAID_STORAGE
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  amount: string
  destination: string
}
