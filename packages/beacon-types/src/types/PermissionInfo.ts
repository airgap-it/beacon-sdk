import { AppMetadata } from './beacon/AppMetadata'
import { PermissionEntity } from './PermissionEntity'

export interface PermissionInfo extends PermissionEntity {
  accountIdentifier: string
  senderId: string
  appMetadata: AppMetadata
  website: string
  publicKey?: string
  connectedAt: number
}
