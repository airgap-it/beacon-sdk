import { TezosBaseOperation, TezosOperationType } from '../../..'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosEndorsementOperation extends TezosBaseOperation {
  kind: TezosOperationType.ENDORSEMENT
  level: string
}
