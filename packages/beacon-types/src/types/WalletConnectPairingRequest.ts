import { PeerInfo } from './PeerInfo'

/**
 * @internalapi
 */
export interface WalletConnectPairingRequest extends PeerInfo {
  id: string
  type: 'walletconnect-pairing-request'
  name: string
  publicKey: string
  uri: string
  icon?: string // TODO: Should this be a URL or base64 image?
  appUrl?: string
}

/**
 * @internalapi
 */
export type ExtendedWalletConnectPairingRequest = WalletConnectPairingRequest & {
  senderId: string
}
