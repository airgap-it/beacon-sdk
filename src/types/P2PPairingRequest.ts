import { PeerInfo } from './PeerInfo'

export interface P2PPairingRequest extends PeerInfo {
  id: string
  type: 'p2p-pairing-request'
  name: string
  publicKey: string
  relayServer: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}

export type ExtendedP2PPairingRequest = P2PPairingRequest & {
  senderId: string
}
