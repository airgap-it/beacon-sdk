import { Origin } from '..'
import { Notification } from './beacon/messages/PermissionResponse'
import { PermissionEntity } from './PermissionEntity'

export type AccountIdentifier = string

export interface AccountInfo extends PermissionEntity {
  accountIdentifier: AccountIdentifier
  senderId: string
  origin: {
    type: Origin
    id: string
  }
  publicKey: string
  connectedAt: number
  notification?: Notification
}
