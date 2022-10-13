import { Origin } from '..'
import { PermissionEntity } from './PermissionEntity'
import { Notification } from './Notification'

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
