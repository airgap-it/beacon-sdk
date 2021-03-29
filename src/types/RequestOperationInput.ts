import { PartialTezosOperation } from './tezos/PartialTezosOperation'

/**
 * @category DApp
 */
export interface RequestOperationInput {
  operationDetails: PartialTezosOperation[]
}
