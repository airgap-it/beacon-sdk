import { Network, PermissionScope } from '..'

export interface PermissionEntity {
  address: string
  network: Network
  scopes: PermissionScope[]
}
