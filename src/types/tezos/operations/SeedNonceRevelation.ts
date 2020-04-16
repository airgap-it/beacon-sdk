import { TezosOperation, TezosOperationType } from '../../..'

export interface TezosSeedNonceRevelationOperation extends TezosOperation {
  kind: TezosOperationType.SEED_NONCE_REVELATION
  level: string
  nonce: string
}
