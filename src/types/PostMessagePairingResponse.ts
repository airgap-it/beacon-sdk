import { PeerInfo } from './PeerInfo'

export interface PostMessagePairingResponse extends PeerInfo {
  id: string
  type: 'postmessage-pairing-response'
  name: string
  publicKey: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}
