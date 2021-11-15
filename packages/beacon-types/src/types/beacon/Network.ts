import { NetworkType } from '@airgap/beacon-types'

export interface Network {
  type: NetworkType
  name?: string
  rpcUrl?: string
}
