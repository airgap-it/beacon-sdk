import { TezosOperation, TezosOperationType } from "./OperationTypes"

export interface TezosEndorsementOperation extends TezosOperation {
    kind: TezosOperationType.ENDORSEMENT
    level: string
}