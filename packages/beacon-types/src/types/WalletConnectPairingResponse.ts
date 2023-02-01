import { PeerInfo } from './PeerInfo'

/**
 * @internalapi
 */
export interface WalletConnectPairingResponse extends PeerInfo {
  id: string
  type: 'walletconnect-pairing-response'
  name: string
  publicKey: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}

/**
 * @internalapi
 */
export type ExtendedWalletConnectPairingResponse = WalletConnectPairingResponse & {
  senderId: string
  extensionId: string
}
// TODO: Rename to "WalletPeerInfo"?
