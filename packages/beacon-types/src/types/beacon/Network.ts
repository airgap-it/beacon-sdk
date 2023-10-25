import { NetworkType } from '@mavrykdynamics/beacon-types'

export interface Network {
  type: NetworkType
  name?: string
  rpcUrl?: string
}
