import { AppMetadata, PermissionRequestV3 } from '@mavrykdynamics/beacon-types'
import { SubstratePermissionScope } from '../permission-scope'

export interface SubstratePermissionRequest extends PermissionRequestV3<'substrate'> {
  blockchainData: {
    scopes: SubstratePermissionScope[] // enum
    appMetadata: AppMetadata
    network?: {
      genesisHash: string // Wallet shows only those accounts
      rpc?: string // For development nodes?
    }[] // Array to "whitelist" certain networks? (optional)
  }
}
