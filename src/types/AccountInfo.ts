import { Origin } from '..'
import { PermissionEntity } from './PermissionEntity'

export type AccountIdentifier = string

export interface AccountInfo extends PermissionEntity {
  accountIdentifier: AccountIdentifier
  beaconId: string
  origin: {
    type: Origin
    id: string
  }
  pubKey: string
  connectedAt: Date
}
