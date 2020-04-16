import { Network, TezosOperations } from '..'

export interface RequestOperationInput {
  network?: Network
  operationDetails: Partial<TezosOperations>[]
}
