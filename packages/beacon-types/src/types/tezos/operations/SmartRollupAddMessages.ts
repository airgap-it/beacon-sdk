import { TezosOperationType } from '../OperationTypes'

export interface SmartRollupAddMessagesOperation {
  kind: TezosOperationType.SMART_ROLLUP_ADD_MESSAGES
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  message: string[]
}
