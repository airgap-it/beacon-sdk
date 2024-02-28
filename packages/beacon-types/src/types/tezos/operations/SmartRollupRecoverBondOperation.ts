import { TezosOperationType } from '../OperationTypes'

export interface SmartRollupRecoverBondOperation {
  kind: TezosOperationType.SMART_ROLLUP_RECOVER_BOND
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  staker: string
}
