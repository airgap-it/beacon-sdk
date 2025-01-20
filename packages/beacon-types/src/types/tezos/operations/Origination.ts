import { TezosBaseOperation, TezosOperationType } from '../../..'
import { ScriptedContracts } from '../common'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosOriginationOperation extends TezosBaseOperation {
  kind: TezosOperationType.ORIGINATION
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  balance: string
  delegate?: string
  script?: ScriptedContracts
}
