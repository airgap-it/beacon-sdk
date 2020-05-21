import { AppMetadata, Network, PermissionScope } from '..'

export interface PermissionInfo {
  accountIdentifier: string
  beaconId: string
  appMetadata: AppMetadata
  website: string
  address: string
  pubkey: string
  network: Network
  scopes: PermissionScope[]
  connectedAt: Date
}
