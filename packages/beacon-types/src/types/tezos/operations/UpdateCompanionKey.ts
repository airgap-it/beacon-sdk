import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosUpdateConsensusKeyOperation extends TezosBaseOperation {
  kind: TezosOperationType.UPDATE_COMPANION_KEY
  source: string;
  fee: string;
  counter: string;
  gas_limit: string;
  storage_limit: string;
  pk: string;
  proof?: string;
}
