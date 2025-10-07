import { ExtendedPeerInfo, PeerInfo } from './PeerInfo'

/**
 * @internalapi
 */
export class PostMessagePairingResponse implements PeerInfo {
  readonly type: string = 'postmessage-pairing-response'
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
  }
}

/**
 * @internalapi
 */
export class ExtendedPostMessagePairingResponse
  extends PostMessagePairingResponse
  implements ExtendedPeerInfo
{
  senderId: string
  extensionId: string

  constructor(
    id: string,
    name: string,
    publicKey: string,
    version: string,
    senderId: string,
    extensionId: string,
    protocolVersion?: number,
    icon?: string,
    appUrl?: string
  ) {
    super(id, name, publicKey, version, protocolVersion, icon, appUrl)
    this.senderId = senderId
    this.extensionId = extensionId
  }
}
// TODO: Rename to "WalletPeerInfo"?
