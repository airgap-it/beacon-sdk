import { AppMetadata, PermissionRequestV3 } from '@airgap/beacon-types'
import { DekuPermissionScope } from '../permission-scope'

export interface DekuPermissionRequest extends PermissionRequestV3<'deku'> {
  blockchainData: {
    scopes: DekuPermissionScope[] // enum
    appMetadata: AppMetadata
  }
}
