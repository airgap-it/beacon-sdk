import { PeerInfo } from './PeerInfo'

export interface PostMessagePairingRequest extends PeerInfo {
  id: string
  type: 'postmessage-pairing-request'
  name: string
  publicKey: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}

export type ExtendedPostMessagePairingRequest = PostMessagePairingRequest & {
  senderId: string
}
