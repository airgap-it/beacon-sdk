import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosRevealOperation extends TezosBaseOperation {
  kind: TezosOperationType.REVEAL
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  public_key: string
}
