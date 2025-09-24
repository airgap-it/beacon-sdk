import { ExtendedPeerInfo, PeerInfo } from './PeerInfo'

/**
 * @internalapi
 */
export class P2PPairingRequest implements PeerInfo {
  readonly type: string = 'p2p-pairing-request'
  relayServer: string
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
    relayServer: string,
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
    this.relayServer = relayServer
    this.protocolVersion = protocolVersion
  }
}

/**
 * @internalapi
 */
export class ExtendedP2PPairingRequest extends P2PPairingRequest implements ExtendedPeerInfo {
  senderId: string

  constructor(
    id: string,
    name: string,
    publicKey: string,
    version: string,
    relayServer: string,
    senderId: string,
    protocolVersion?: number,
    icon?: string,
    appUrl?: string
  ) {
    super(id, name, publicKey, version, relayServer, protocolVersion, icon, appUrl)
    this.senderId = senderId
  }
}
