import { PeerInfo } from './PeerInfo'

export interface P2PPairingRequest extends PeerInfo {
  name: string
  publicKey: string
  relayServer: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}
