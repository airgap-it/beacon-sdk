import { AppMetadata, PermissionResponseV3 } from '/beacon-types'
import { SubstratePermissionScope } from '../permission-scope'

export interface SubstratePermissionResponse extends PermissionResponseV3<'substrate'> {
  blockchainData: {
    appMetadata: AppMetadata
    scopes: SubstratePermissionScope[] // enum
    accounts: {
      accountId: string
      network?: {
        genesisHash: string
        rpc?: string
      }
      publicKey: string
      address: string
    }[]
  }
}
