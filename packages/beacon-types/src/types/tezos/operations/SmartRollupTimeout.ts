import { TezosOperationType } from '../OperationTypes'

export interface SmartRollupTimeoutOperation {
  kind: TezosOperationType.SMART_ROLLUP_TIMEOUT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  stakers: SmartRollupTimeoutStakers
}

export interface SmartRollupTimeoutStakers {
  alice: string
  bob: string
}
