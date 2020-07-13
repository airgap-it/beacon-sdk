export interface PostMessagePairingResponse {
  name: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
  publicKey: string
}
