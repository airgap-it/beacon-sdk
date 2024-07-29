import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosUpdateConsensusKeyOperation extends TezosBaseOperation {
  kind: TezosOperationType.UPDATE_CONSENSUS_KEY
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  pk: string
}
