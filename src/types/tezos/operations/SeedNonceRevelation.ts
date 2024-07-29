import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosSeedNonceRevelationOperation extends TezosBaseOperation {
  kind: TezosOperationType.SEED_NONCE_REVELATION
  level: string
  nonce: string
}
