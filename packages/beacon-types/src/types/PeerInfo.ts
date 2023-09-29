export interface PeerInfo {
  id: string
  name: string
  type: string
  icon?: string
  appUrl?: string
  publicKey: string
  version: string
}

export interface ExtendedPeerInfo extends PeerInfo {
  senderId: string
}

export type PeerInfoType = PeerInfo | ExtendedPeerInfo
