import { PeerInfo } from './PeerInfo'

/**
 * @internalapi
 */
export interface BridgePairingResponse extends PeerInfo {
  id: string
  type: 'bridge-pairing-response'
  name: string
  publicKey: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}

/**
 * @internalapi
 */
export type ExtendedBridgePairingResponse = BridgePairingResponse & {
  senderId: string
  extensionId: string
}
// TODO: Rename to "WalletPeerInfo"?
