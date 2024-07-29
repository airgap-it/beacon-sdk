import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'
import {
  SmartRollupPublishCommitment,
} from '../common'

export interface TezosSmartRollupPublishOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_PUBLISH
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  commitment: SmartRollupPublishCommitment
}
