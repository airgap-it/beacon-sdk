import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface FailingNoopOperation extends TezosBaseOperation {
  kind: TezosOperationType.FAILING_NOOP
  arbitrary: string
}
