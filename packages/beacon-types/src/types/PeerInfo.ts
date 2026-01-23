export interface PeerInfo {
  id: string
  name: string
  type: string
  icon?: string
  appUrl?: string
  publicKey: string
  version: string
  protocolVersion?: number
}

export interface ExtendedPeerInfo extends PeerInfo {
  senderId: string
}

export type PeerInfoType = PeerInfo | ExtendedPeerInfo
