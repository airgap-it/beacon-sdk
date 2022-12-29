import { AppMetadata, NetworkType, PermissionResponseV3 } from '@airgap/beacon-types'
import { DekuPermissionScope } from '../permission-scope'

export interface DekuPermissionResponse extends PermissionResponseV3<'deku'> {
  blockchainData: {
    appMetadata: AppMetadata
    scopes: DekuPermissionScope[] // enum
    accounts: {
      accountId: string
      publicKey: string
      address: string
      network: {
        name?: string
        type: NetworkType
        rpcUrl: string
      }
    }[]
    origin: {
      type: any
      id: any
    }
  }
}
