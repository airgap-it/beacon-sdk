import { TezosBaseOperation } from '../TezosBaseOperation'
import { TezosOperationType } from '../TezosOperationType'
import { TezosTransactionParameters } from '../TezosTransactionParameters'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosTransactionOperation extends TezosBaseOperation {
  kind: TezosOperationType.TRANSACTION
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  amount: string
  destination: string
  parameters?: TezosTransactionParameters
}
