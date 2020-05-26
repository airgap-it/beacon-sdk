import { AppMetadata } from '..'
import { PermissionEntity } from './PermissionEntity'

export interface PermissionInfo extends PermissionEntity {
  accountIdentifier: string
  beaconId: string
  appMetadata: AppMetadata
  website: string
  pubKey: string
  connectedAt: Date
}
