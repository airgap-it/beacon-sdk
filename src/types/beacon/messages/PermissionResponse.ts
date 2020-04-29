import { BeaconBaseMessage, BeaconMessageType, Network, PermissionScope } from '../../..'

export interface PermissionResponse extends BeaconBaseMessage {
  type: BeaconMessageType.PermissionResponse
  pubkey: string // Public Key, because it can be used to verify signatures
  network: Network // Network on which the permissions have been granted
  scopes: PermissionScope[] // Permissions that have been granted for this specific address / account
}
