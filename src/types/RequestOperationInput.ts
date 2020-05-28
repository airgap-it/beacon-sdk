import { Network, TezosOperation } from '..'

export interface RequestOperationInput {
  network?: Network
  operationDetails: Partial<TezosOperation>[]
}
