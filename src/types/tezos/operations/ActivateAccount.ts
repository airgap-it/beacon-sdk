import { TezosBaseOperation, TezosOperationType } from '../../..'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosActivateAccountOperation extends TezosBaseOperation {
  kind: TezosOperationType.ACTIVATE_ACCOUNT
  pkh: string
  secret: string
}
