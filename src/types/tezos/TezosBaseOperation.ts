import { TezosOperationType } from './TezosOperationType'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosBaseOperation {
  kind: TezosOperationType
}
