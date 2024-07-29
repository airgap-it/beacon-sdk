import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosActivateAccountOperation extends TezosBaseOperation {
  kind: TezosOperationType.ACTIVATE_ACCOUNT
  pkh: string
  secret: string
}
