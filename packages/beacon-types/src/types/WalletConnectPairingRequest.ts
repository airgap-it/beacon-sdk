import { ExtendedPeerInfo, PeerInfo } from './PeerInfo'

/**
 * @internalapi
 */
export class WalletConnectPairingRequest implements PeerInfo {
  readonly type: string = 'walletconnect-pairing-request'
  uri: string
  id: string
  name: string
  icon?: string | undefined
  appUrl?: string | undefined
  publicKey: string
  version: string
  protocolVersion?: number

  constructor(
    id: string,
    name: string,
    publicKey: string,
    version: string,
    uri: string,
    protocolVersion?: number,
    icon?: string,
    appUrl?: string
  ) {
    this.id = id
    this.name = name
    this.icon = icon
    this.appUrl = appUrl
    this.publicKey = publicKey
    this.version = version
    this.protocolVersion = protocolVersion
    this.uri = uri
  }
}

/**
 * @internalapi
 */
export class ExtendedWalletConnectPairingRequest
  extends WalletConnectPairingRequest
  implements ExtendedPeerInfo
{
  senderId: string

  constructor(
    id: string,
    name: string,
    publicKey: string,
    version: string,
    senderId: string,
    uri: string,
    protocolVersion?: number,
    icon?: string,
    appUrl?: string
  ) {
    super(id, name, publicKey, version, uri, protocolVersion, icon, appUrl)
    this.senderId = senderId
  }
}
