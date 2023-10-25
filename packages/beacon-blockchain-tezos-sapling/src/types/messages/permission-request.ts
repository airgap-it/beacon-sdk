import { AppMetadata, NetworkType, PermissionRequestV3 } from '@mavrykdynamics/beacon-types'
import { TezosSaplingPermissionScope } from '../permission-scope'

export interface TezosSaplingPermissionRequest extends PermissionRequestV3<'tezos-sapling'> {
  blockchainData: {
    scopes: TezosSaplingPermissionScope[] // enum
    appMetadata: AppMetadata
    network: {
      contract: string // sapling contract
      type: NetworkType
      name?: string
      rpcUrl?: string
    }
  }
}
