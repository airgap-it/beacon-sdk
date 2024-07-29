import { TezosBaseOperation } from '../TezosBaseOperation'
import { TezosOperationType } from '../TezosOperationType'
import { TezosBlockHeader } from '../TezosBlockHeader'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosDoubleBakingEvidenceOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_BAKING_EVIDENCE
  bh1: TezosBlockHeader
  bh2: TezosBlockHeader
}
