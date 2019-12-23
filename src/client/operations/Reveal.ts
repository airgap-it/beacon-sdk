import { TezosOperation, TezosOperationType } from "./OperationTypes"

export interface TezosRevealOperation extends TezosOperation {
    kind: TezosOperationType.REVEAL
    source: string
    fee: string
    counter: string
    gas_limit: string
    storage_limit: string
    public_key: string
}
