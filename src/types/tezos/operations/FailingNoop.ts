import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosFailingNoopOperation extends TezosBaseOperation {
  kind: TezosOperationType.FAILING_NOOP
  arbitrary: string
}
