import { TezosOperationType } from '../OperationTypes'
import { SmartRollupPublishCommitment } from '../utils'

export interface SmartRollupPublishOperation {
  kind: TezosOperationType.SMART_ROLLUP_PUBLISH
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  commitment: SmartRollupPublishCommitment
}
