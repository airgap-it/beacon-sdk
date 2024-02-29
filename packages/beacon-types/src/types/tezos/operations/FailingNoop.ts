import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosFailingNoopOperation extends TezosBaseOperation {
  kind: TezosOperationType.FAILING_NOOP
  arbitrary: string
}
