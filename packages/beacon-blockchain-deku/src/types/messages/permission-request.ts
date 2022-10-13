import {
  AppMetadata,
  NetworkType,
  PermissionRequestV3,
  BeaconMessageType
} from '@airgap/beacon-types'
import { DekuPermissionScope } from '../permission-scope'

export interface DekuPermissionRequest extends PermissionRequestV3<'deku'> {
  blockchainIdentifier: 'deku'
  type: BeaconMessageType.PermissionRequest
  blockchainData: {
    scopes: DekuPermissionScope[] // enum
    appMetadata: AppMetadata
    network: {
      name?: string
      type: NetworkType
      rpcUrl: string
    }
  }
}
