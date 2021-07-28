import { NetworkType } from '../..'

export interface Network {
  type: NetworkType
  name?: string
  rpcUrl?: string
}
