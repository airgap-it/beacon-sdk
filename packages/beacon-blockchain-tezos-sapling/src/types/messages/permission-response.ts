import { AppMetadata, NetworkType, PermissionResponseV3 } from '@mavrykdynamics/beacon-types'
import { TezosSaplingPermissionScope } from '../permission-scope'

export interface TezosSaplingPermissionResponse extends PermissionResponseV3<'tezos-sapling'> {
  blockchainData: {
    appMetadata: AppMetadata
    scopes: TezosSaplingPermissionScope[] // enum
    accounts: {
      accountId: string
      address: string
      viewingKey?: string // If the "viewing key" scope is not set, this value has to be removed by the SDK
      network: {
        contract: string // sapling contract
        type: NetworkType
        name?: string
        rpcUrl?: string
      }
    }[]
  }
}
