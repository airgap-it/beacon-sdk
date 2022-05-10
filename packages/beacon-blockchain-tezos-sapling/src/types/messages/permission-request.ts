import { AppMetadata, PermissionRequestV3 } from '@airgap/beacon-types'
import { TezosSaplingPermissionScope } from '../permission-scope'

export interface TezosSaplingPermissionRequest extends PermissionRequestV3<'tezos-sapling'> {
  blockchainData: {
    scopes: TezosSaplingPermissionScope[] // enum
    appMetadata: AppMetadata
    network: {
      contract: string // sapling contract
    } // Same as tezos
  }
}
