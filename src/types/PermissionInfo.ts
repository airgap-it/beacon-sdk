import { AppMetadata } from '..'
import { PermissionEntity } from './PermissionEntity'

export interface PermissionInfo extends PermissionEntity {
  accountIdentifier: string
  beaconId: string
  appMetadata: AppMetadata
  website: string
  pubkey: string
  connectedAt: Date
}
