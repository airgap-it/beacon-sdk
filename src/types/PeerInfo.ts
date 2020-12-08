export interface PeerInfo {
  name: string
  publicKey: string
  version: string
}

export type ExtendedPeerInfo = PeerInfo & { senderId: string }
