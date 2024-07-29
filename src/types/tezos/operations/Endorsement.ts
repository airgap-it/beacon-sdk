import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosEndorsementOperation extends TezosBaseOperation {
  kind: TezosOperationType.ENDORSEMENT
  level: string
}
