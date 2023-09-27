import { PeerInfo } from './PeerInfo'

/**
 * @internalapi
 */
export class WalletConnectPairingResponse implements PeerInfo {
  readonly type: string = 'walletconnect-pairing-response'
  id: string
  name: string
  icon?: string | undefined
  appUrl?: string | undefined
  publicKey: string
  version: string

  constructor(
    id: string,
    name: string,
    publicKey: string,
    version: string,
    icon?: string,
    appUrl?: string
  ) {
    this.id = id
    this.name = name
    this.icon = icon
    this.appUrl = appUrl
    this.publicKey = publicKey
    this.version = version
  }
}

/**
 * @internalapi
 */
export class ExtendedWalletConnectPairingResponse extends WalletConnectPairingResponse {
  senderId: string
  extensionId: string

  constructor(
    id: string,
    name: string,
    publicKey: string,
    version: string,
    senderId: string,
    extensionId: string,
    icon?: string,
    appUrl?: string
  ) {
    super(id, name, publicKey, version, icon, appUrl)
    this.senderId = senderId
    this.extensionId = extensionId
  }
}
// TODO: Rename to "WalletPeerInfo"?
