import { TezosOperation, TezosOperationType } from '../../..'

export interface TezosActivateAccountOperation extends TezosOperation {
  kind: TezosOperationType.ACTIVATE_ACCOUNT
  pkh: string
  secret: string
}
