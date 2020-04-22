import { TezosBaseOperation, TezosOperationType } from '../../..'

export interface TezosActivateAccountOperation extends TezosBaseOperation {
  kind: TezosOperationType.ACTIVATE_ACCOUNT
  pkh: string
  secret: string
}
