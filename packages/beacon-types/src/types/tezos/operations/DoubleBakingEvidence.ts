import { TezosBaseOperation, TezosOperationType, TezosBlockHeader } from '../../..'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosDoubleBakingEvidenceOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_BAKING_EVIDENCE
  bh1: TezosBlockHeader
  bh2: TezosBlockHeader
}
