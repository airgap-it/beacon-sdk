import { TezosOperation, TezosOperationType } from "./OperationTypes"

export interface TezosActivateAccountOperation extends TezosOperation {
    kind: TezosOperationType.ACTIVATE_ACCOUNT
    pkh: string
    secret: string
}

