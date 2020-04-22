import { TezosBaseOperation, TezosOperationType } from '../../..'

export interface TezosSeedNonceRevelationOperation extends TezosBaseOperation {
  kind: TezosOperationType.SEED_NONCE_REVELATION
  level: string
  nonce: string
}
