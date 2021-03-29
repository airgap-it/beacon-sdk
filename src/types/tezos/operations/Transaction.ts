import { TezosBaseOperation, TezosOperationType, TezosTransactionParameters } from '../../..'

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
