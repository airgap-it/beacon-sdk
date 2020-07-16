import { PeerInfo } from './PeerInfo'

export interface PostMessagePairingRequest extends PeerInfo {
  name: string
  publicKey: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}
