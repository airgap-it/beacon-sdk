import { Network, PermissionScope, Threshold } from '..'

export interface PermissionEntity {
  address: string
  network: Network
  scopes: PermissionScope[]
  threshold?: Threshold
}
