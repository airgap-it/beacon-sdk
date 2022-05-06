import { AppMetadata, PermissionResponseV3 } from '@airgap/beacon-types'
import { TezosSaplingPermissionScope } from '../permission-scope'

export interface TezosSaplingPermissionResponse extends PermissionResponseV3<'tezos-sapling'> {
  blockchainData: {
    appMetadata: AppMetadata
    scopes: TezosSaplingPermissionScope[] // enum
    accounts: {
      accountId: string
      address: string
    }[]
  }
}
