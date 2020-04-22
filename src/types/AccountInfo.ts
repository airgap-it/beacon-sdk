import { Origin, Network, PermissionScope } from '..'

export type AccountIdentifier = string

export interface AccountInfo {
  accountIdentifier: AccountIdentifier
  beaconId: string
  origin: {
    type: Origin
    id: string
  }
  address?: string
  pubkey?: string
  network: Network
  scopes: PermissionScope[]
  connectedAt: Date
}
