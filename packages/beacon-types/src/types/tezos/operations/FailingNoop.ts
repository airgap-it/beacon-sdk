import { TezosOperationType } from '../OperationTypes'

export interface FailingNoopOperation {
  kind: TezosOperationType.FAILING_NOOP
  arbitrary: string
}
