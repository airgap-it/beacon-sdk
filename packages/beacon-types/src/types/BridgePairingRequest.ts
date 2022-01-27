import { PeerInfo } from './PeerInfo'

/**
 * @internalapi
 */
export interface BridgePairingRequest extends PeerInfo {
  id: string
  type: 'bridge-pairing-request'
  name: string
  publicKey: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}

/**
 * @internalapi
 */
export type ExtendedBridgePairingRequest = BridgePairingRequest & {
  senderId: string
}
