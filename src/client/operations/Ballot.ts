import { TezosOperation, TezosOperationType } from "./OperationTypes"

export interface TezosBallotOperation extends TezosOperation {
    kind: TezosOperationType.BALLOT
    source: string
    period: string
    proposal: string
    ballot: "nay" | "yay" | "pass"
}