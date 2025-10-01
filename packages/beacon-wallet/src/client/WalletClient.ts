import axios from 'axios'
import {
  Serializer,
  Client,
  LocalStorage,
  PermissionManager,
  AppMetadataManager,
  getSenderId,
  Logger,
  NOTIFICATION_ORACLE_URL,
  isWrappedMessageVersion,
  getPreferredMessageProtocolVersion
} from '@airgap/beacon-core'

import { ExposedPromise, toHex } from '@airgap/beacon-utils'

import {
  ConnectionContext,
  BeaconRequestMessage,
  BeaconMessageType,
  AcknowledgeResponseInput,
  ExtendedP2PPairingResponse,
  ExtendedPeerInfo,
  PeerInfo,
  DisconnectMessage,
  TransportType,
  BeaconRequestOutputMessage,
  BeaconResponseInputMessage,
  AppMetadata,
  PermissionInfo,
  TransportStatus,
  BeaconMessage,
  BeaconMessageWrapper,
  BeaconBaseMessage,
  StorageKey,
  PushToken,
  PostMessagePairingRequest,
  ExtendedPostMessagePairingRequest,
  P2PPairingRequest,
  ExtendedP2PPairingRequest,
  WalletConnectPairingRequest,
  ExtendedWalletConnectPairingRequest
} from '@airgap/beacon-types'
import { WalletClientOptions } from './WalletClientOptions'
import { WalletP2PTransport } from '../transports/WalletP2PTransport'
import { IncomingRequestInterceptor } from '../interceptors/IncomingRequestInterceptor'
import { OutgoingResponseInterceptor } from '../interceptors/OutgoingResponseInterceptor'

const logger = new Logger('WalletClient')

/**
 * @publicapi
 *
 * The WalletClient has to be used in the wallet. It handles all the logic related to connecting to beacon-compatible
 * dapps and handling/responding to requests.
 *
 * @category Wallet
 */
export class WalletClient extends Client {
  /**
   * Returns whether or not the transport is connected
   */
  protected readonly _isConnected: ExposedPromise<boolean> = new ExposedPromise()
  public get isConnected(): Promise<boolean> {
    return this._isConnected.promise
  }

  private readonly permissionManager: PermissionManager
  private readonly appMetadataManager: AppMetadataManager

  /**
   * This array stores pending requests, meaning requests we received and have not yet handled / sent a response.
   */
  private pendingRequests: [
    BeaconRequestMessage | BeaconMessageWrapper<BeaconBaseMessage>,
    ConnectionContext
  ][] = []

  constructor(config: WalletClientOptions) {
    super({
      storage: config && config.storage ? config.storage : new LocalStorage(),
      ...config
    })
    this.permissionManager = new PermissionManager(this.storage)
    this.appMetadataManager = new AppMetadataManager(this.storage)
  }

  public async init(): Promise<TransportType> {
    const keyPair = await this.keyPair // We wait for keypair here so the P2P Transport creation is not delayed and causing issues
    const p2pTransport = new WalletP2PTransport(
      this.name,
      keyPair,
      this.storage,
      this.matrixNodes,
      this.iconUrl,
      this.appUrl
    )

    return super.init(p2pTransport)
  }

  /**
   * This method initiates a connection to the P2P network and registers a callback that will be called
   * whenever a message is received.
   *
   * @param newMessageCallback The callback that will be invoked for every message the transport receives.
   */
  public async connect(
    newMessageCallback: (
      message: BeaconRequestOutputMessage,
      connectionContext: ConnectionContext
    ) => void
  ): Promise<void> {
    this.handleResponse = async (
      message: BeaconRequestMessage | BeaconMessageWrapper<BeaconBaseMessage> | DisconnectMessage,
      connectionContext: ConnectionContext
    ): Promise<void> => {
      // Define valid request types that wallets should process
      const validRequestTypes = [
        BeaconMessageType.PermissionRequest,
        BeaconMessageType.OperationRequest,
        BeaconMessageType.SignPayloadRequest,
        BeaconMessageType.BroadcastRequest,
        BeaconMessageType.ProofOfEventChallengeRequest,
        BeaconMessageType.SimulatedProofOfEventChallengeRequest,
        BeaconMessageType.BlockchainRequest,
        BeaconMessageType.ChangeAccountRequest
      ]

      if (isWrappedMessageVersion(message.version)) {
        const typedMessage = message as BeaconMessageWrapper<BeaconBaseMessage>

        if (typedMessage.message.type === BeaconMessageType.Disconnect) {
          return this.disconnect(typedMessage.senderId)
        }

        // Filter out response types (echoed back from Matrix room)
        if (!validRequestTypes.includes(typedMessage.message.type)) {
          return
        }

        if (!this.pendingRequests.some((request) => request[0].id === message.id)) {
          this.pendingRequests.push([typedMessage, connectionContext])

          await this.sendAcknowledgeResponse(typedMessage, connectionContext)

          await IncomingRequestInterceptor.intercept({
            message: typedMessage,
            connectionInfo: connectionContext,
            appMetadataManager: this.appMetadataManager,
            interceptorCallback: newMessageCallback
          })
        }
      } else {
        const typedMessage = message as BeaconRequestMessage | DisconnectMessage

        if (typedMessage.type === BeaconMessageType.Disconnect) {
          return this.disconnect(typedMessage.senderId)
        }

        // Filter out response types (echoed back from Matrix room)
        if (!validRequestTypes.includes(typedMessage.type)) {
          return
        }

        if (!this.pendingRequests.some((request) => request[0].id === message.id)) {
          this.pendingRequests.push([typedMessage, connectionContext])

          if (typedMessage.version && typedMessage.version !== '1') {
            await this.sendAcknowledgeResponse(typedMessage, connectionContext)
          }

          await IncomingRequestInterceptor.intercept({
            message: typedMessage,
            connectionInfo: connectionContext,
            appMetadataManager: this.appMetadataManager,
            interceptorCallback: newMessageCallback
          })
        }
      }
    }

    return this._connect()
  }

  public async getRegisterPushChallenge(
    backendUrl: string,
    accountPublicKey: string,
    oracleUrl: string = NOTIFICATION_ORACLE_URL
  ) {
    // Check if account is already registered
    const challenge: { id: string; timestamp: string } = (await axios.get(`${oracleUrl}/challenge`))
      .data

    const constructedString = [
      'Tezos Signed Message: ',
      challenge.id,
      challenge.timestamp,
      accountPublicKey,
      backendUrl
    ].join(' ')

    const bytes = toHex(constructedString)
    const payloadBytes = '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes

    return {
      challenge,
      payloadToSign: payloadBytes
    }
  }

  public async registerPush(
    challenge: { id: string; timestamp: string },
    signature: string,
    backendUrl: string,
    accountPublicKey: string,
    protocolIdentifier: string,
    deviceId: string,
    oracleUrl: string = NOTIFICATION_ORACLE_URL
  ): Promise<PushToken> {
    const tokens = await this.storage.get(StorageKey.PUSH_TOKENS)
    const token = tokens.find(
      (el) => el.publicKey === accountPublicKey && el.backendUrl === backendUrl
    )
    if (token) {
      return token
    }

    const register: {
      accessToken: string
      managementToken: string
      message: string
      success: boolean
    } = (
      await axios.post(`${oracleUrl}/register`, {
        name: this.name,
        challenge,
        accountPublicKey,
        signature,
        backendUrl,
        protocolIdentifier,
        deviceId
      })
    ).data

    const newToken = {
      publicKey: accountPublicKey,
      backendUrl,
      accessToken: register.accessToken,
      managementToken: register.managementToken
    }

    tokens.push(newToken)

    await this.storage.set(StorageKey.PUSH_TOKENS, tokens)

    return newToken
  }

  /**
   * The method will attempt to initiate a connection using the active transport.
   */
  public async _connect(attempts: number = 3): Promise<void> {
    const transport: WalletP2PTransport = (await this.transport) as WalletP2PTransport
    if (attempts == 0 || transport.connectionStatus !== TransportStatus.NOT_CONNECTED) {
      return
    }

    try {
      await transport.connect()
    } catch (err: any) {
      logger.warn('_connect', err.message)
      await transport.disconnect()
      await this._connect(--attempts)
      return
    }

    transport
      .addListener(async (message: unknown, connectionInfo: ConnectionContext) => {
        if (typeof message === 'string') {
          const peer = await this.findPeer(connectionInfo.id)
          const protocolVersion = this.getPeerProtocolVersion(peer)
          const deserializedMessage = (await new Serializer(protocolVersion).deserialize(
            message
          )) as BeaconRequestMessage
          this.handleResponse(deserializedMessage, connectionInfo)
        }
      })
      .catch((error) => logger.log('_connect', error))
    this._isConnected.resolve(true)
  }

  /**
   * This method sends a response for a specific request back to the DApp
   *
   * @param message The BeaconResponseMessage that will be sent back to the DApp
   */
  public async respond(message: BeaconResponseInputMessage): Promise<void> {
    logger.log('RESPONSE', message)
    const request = this.pendingRequests.find(
      (pendingRequest) => pendingRequest[0].id === message.id
    )
    if (!request) {
      throw new Error('No matching request found!')
    }

    this.pendingRequests = this.pendingRequests.filter(
      (pendingRequest) => pendingRequest[0].id !== message.id
    )

    await OutgoingResponseInterceptor.intercept({
      senderId: await getSenderId(await this.beaconId),
      request: request[0],
      message,
      ownAppMetadata: await this.getOwnAppMetadata(),
      permissionManager: this.permissionManager,
      appMetadataManager: this.appMetadataManager,
      interceptorCallback: async (response: BeaconMessage): Promise<void> => {
        await this.respondToMessage(response, request[1])
      }
    })
  }

  public async getAppMetadataList(): Promise<AppMetadata[]> {
    return this.appMetadataManager.getAppMetadataList()
  }

  public async getAppMetadata(senderId: string): Promise<AppMetadata | undefined> {
    return this.appMetadataManager.getAppMetadata(senderId)
  }

  public async removeAppMetadata(senderId: string): Promise<void> {
    return this.appMetadataManager.removeAppMetadata(senderId)
  }

  public async removeAllAppMetadata(): Promise<void> {
    return this.appMetadataManager.removeAllAppMetadata()
  }

  public async getPermissions(): Promise<PermissionInfo[]> {
    return this.permissionManager.getPermissions()
  }

  public async getPermission(accountIdentifier: string): Promise<PermissionInfo | undefined> {
    return this.permissionManager.getPermission(accountIdentifier)
  }

  public async removePermission(accountIdentifier: string, senderId: string): Promise<void> {
    return this.permissionManager.removePermission(accountIdentifier, senderId)
  }

  public async removeAllPermissions(): Promise<void> {
    return this.permissionManager.removeAllPermissions()
  }

  private async getPeerInfo(peer: PeerInfo): Promise<ExtendedPeerInfo> {
    const senderId = await getSenderId(peer.publicKey)
    const protocolVersion = this.resolveNegotiatedProtocolVersion((peer as any)?.protocolVersion)
    const peerType = this.getPeerType(peer)

    if (peerType === 'postmessage-pairing-request') {
      const base = peer as PostMessagePairingRequest & {
        icon?: string
        appUrl?: string
      }

      return new ExtendedPostMessagePairingRequest(
        base.id,
        base.name,
        base.publicKey,
        base.version,
        senderId,
        protocolVersion,
        base.icon,
        base.appUrl
      )
    }

    if (peerType === 'p2p-pairing-request') {
      const base = peer as P2PPairingRequest & {
        relayServer: string
        icon?: string
        appUrl?: string
      }

      return new ExtendedP2PPairingRequest(
        base.id,
        base.name,
        base.publicKey,
        base.version,
        base.relayServer,
        senderId,
        protocolVersion,
        base.icon,
        base.appUrl
      )
    }

    if (peerType === 'walletconnect-pairing-request') {
      const base = peer as ExtendedWalletConnectPairingRequest & {
        uri: string
        icon?: string
        appUrl?: string
      }

      return new ExtendedWalletConnectPairingRequest(
        base.id,
        base.name,
        base.publicKey,
        base.version,
        senderId,
        base.uri,
        protocolVersion,
        base.icon,
        base.appUrl
      )
    }

    return {
      ...peer,
      senderId,
      protocolVersion
    }
  }
  private normalizeProtocolVersion(raw: unknown): number | undefined {
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : undefined
  }

  private getLocalPreferredProtocolVersion(): number {
    const preferred = Number(getPreferredMessageProtocolVersion())
    return Number.isFinite(preferred) && preferred >= 1 ? preferred : 1
  }

  private resolveNegotiatedProtocolVersion(rawRemote: unknown): number {
    const remote = this.normalizeProtocolVersion(rawRemote)
    const local = this.getLocalPreferredProtocolVersion()

    if (typeof remote === 'number') {
      return Math.min(remote, local)
    }

    return 1
  }

  /**
   * Add a new peer to the known peers
   * @param peer The new peer to add
   */
  public async addPeer(peer: PeerInfo, sendPairingResponse: boolean = true): Promise<void> {
    return (await this.transport).addPeer(await this.getPeerInfo(peer), sendPairingResponse)
  }

  public async removePeer(
    peer: ExtendedP2PPairingResponse,
    sendDisconnectToPeer: boolean = false
  ): Promise<void> {
    const removePeerResult = (await this.transport).removePeer(peer)

    await this.removePermissionsForPeers([peer])

    if (sendDisconnectToPeer) {
      await this.sendDisconnectToPeer(peer)
    }

    return removePeerResult
  }

  public async removeAllPeers(sendDisconnectToPeers: boolean = false): Promise<void> {
    const peers: ExtendedP2PPairingResponse[] = await (await this.transport).getPeers()
    const removePeerResult = (await this.transport).removeAllPeers()

    await this.removePermissionsForPeers(peers)

    if (sendDisconnectToPeers) {
      const disconnectPromises = peers.map((peer) => this.sendDisconnectToPeer(peer))

      await Promise.all(disconnectPromises)
    }

    return removePeerResult
  }

  private async removePermissionsForPeers(
    peersToRemove: ExtendedP2PPairingResponse[]
  ): Promise<void> {
    const permissions = await this.permissionManager.getPermissions()

    const peerIdsToRemove = peersToRemove.map((peer) => peer.senderId)
    // Remove all permissions with origin of the specified peer
    const permissionsToRemove = permissions.filter((permission) =>
      peerIdsToRemove.includes(permission.appMetadata.senderId)
    )
    const permissionIdentifiersToRemove = permissionsToRemove.map(
      (permissionInfo) => permissionInfo.accountIdentifier
    )
    await this.permissionManager.removePermissions(permissionIdentifiersToRemove)
  }

  /**
   * Send an acknowledge message back to the sender
   *
   * @param message The message that was received
   */
  private async sendAcknowledgeResponse(
    request: BeaconRequestMessage | BeaconMessageWrapper<BeaconBaseMessage>,
    connectionContext: ConnectionContext
  ): Promise<void> {
    // Acknowledge the message
    const acknowledgeResponse: AcknowledgeResponseInput = {
      id: request.id,
      type: BeaconMessageType.Acknowledge
    }

    await OutgoingResponseInterceptor.intercept({
      senderId: await getSenderId(await this.beaconId),
      request,
      message: acknowledgeResponse,
      ownAppMetadata: await this.getOwnAppMetadata(),
      permissionManager: this.permissionManager,
      appMetadataManager: this.appMetadataManager,
      interceptorCallback: async (response: BeaconMessage): Promise<void> => {
        await this.respondToMessage(response, connectionContext)
      }
    })
  }

  /**
   * An internal method to send a BeaconMessage to the DApp
   *
   * @param response Send a message back to the DApp
   */
  private async respondToMessage(
    response: BeaconMessage,
    connectionContext: ConnectionContext
  ): Promise<void> {
    let peer: PeerInfo | undefined
    if (connectionContext) {
      const peerInfos = await this.getPeers()
      peer = peerInfos.find((peerInfo) => peerInfo.publicKey === connectionContext.id)
    }

    const protocolVersion = this.getPeerProtocolVersion(peer)
    const serializedMessage: string = await new Serializer(protocolVersion).serialize(response)
    if (connectionContext) {
      await (await this.transport).send(serializedMessage, peer)
    } else {
      await (await this.transport).send(serializedMessage)
    }
  }

  private async disconnect(senderId: string) {
    const transport = await this.transport
    const peers: ExtendedPeerInfo[] = await transport.getPeers()
    const peer: ExtendedPeerInfo | undefined = peers.find((peerEl) => peerEl.senderId === senderId)

    if (peer) {
      await this.removePeer(peer as any)
    }

    return
  }

  private getPeerType(peer: PeerInfo): string | undefined {
    const candidate = (peer as any)?.type

    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }

    if (peer instanceof PostMessagePairingRequest || peer instanceof ExtendedPostMessagePairingRequest) {
      return 'postmessage-pairing-request'
    }

    if (peer instanceof P2PPairingRequest || peer instanceof ExtendedP2PPairingRequest) {
      return 'p2p-pairing-request'
    }

    if (
      peer instanceof WalletConnectPairingRequest ||
      peer instanceof ExtendedWalletConnectPairingRequest
    ) {
      return 'walletconnect-pairing-request'
    }

    return undefined
  }
}
