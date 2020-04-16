import { PermissionScope, Network } from './Messages'

export type AccountIdentifier = string

export enum Origin {
  EXTENSION = 'extension',
  P2P = 'p2p'
}

export interface AccountInfo {
  accountIdentifier: AccountIdentifier
  beaconId: string
  origin: {
    type: Origin
    id: string
  }
  pubkey?: string
  network: Network
  scopes: PermissionScope[]
  connectedAt: Date
}
