import { PeerInfo } from './PeerInfo'

export interface PostMessagePairingResponse extends PeerInfo {
  name: string
  publicKey: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}
