import { AppMetadata, PermissionResponseV3 } from '@airgap/beacon-types'
import { DekuPermissionScope } from '../permission-scope'

export interface DekuPermissionResponse extends PermissionResponseV3<'deku'> {
  blockchainData: {
    appMetadata: AppMetadata
    scopes: DekuPermissionScope[] // enum
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
