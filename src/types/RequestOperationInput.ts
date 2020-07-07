import { Network } from '..'
import { PartialTezosOperation } from './tezos/PartialTezosOperation'

export interface RequestOperationInput {
  network?: Network
  operationDetails: PartialTezosOperation[]
}
