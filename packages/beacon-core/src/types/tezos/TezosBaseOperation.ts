import { TezosOperationType } from '../..'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosBaseOperation {
  kind: TezosOperationType
}
