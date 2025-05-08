import { Network } from './beacon/Network'
import { PermissionScope } from './beacon/PermissionScope'
import { Threshold } from './beacon/Threshold'

export interface PermissionEntity {
  address: string
  network: Network
  scopes: PermissionScope[]
  threshold?: Threshold
}
