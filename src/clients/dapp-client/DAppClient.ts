import { ExposedPromise } from '../../utils/exposed-promise'

import { Logger } from '../../utils/Logger'
import { generateGUID } from '../../utils/generate-uuid'
import { BeaconEvent, BeaconEventHandlerFunction, BeaconEventType, WalletInfo } from '../../events'
import { BEACON_VERSION } from '../../constants'
import { getAddressFromPublicKey } from '../../utils/crypto'
import { ConnectionContext } from '../../types/ConnectionContext'
import {
  AccountInfo,
  Client,
  TransportType,
  StorageKey,
  BeaconMessageType,
  PermissionScope,
  PermissionResponse,
  NetworkType,
  SignPayloadResponse,
  SignPayloadRequest,
  OperationResponse,
  OperationRequest,
  BroadcastResponse,
  BroadcastRequest,
  ErrorResponse,
  BeaconMessage,
  RequestPermissionInput,
  RequestSignPayloadInput,
  RequestOperationInput,
  RequestBroadcastInput,
  PermissionRequest,
  Serializer,
  LocalStorage,
  PermissionResponseOutput,
  PermissionRequestInput,
  SignPayloadResponseOutput,
  SignPayloadRequestInput,
  OperationResponseOutput,
  OperationRequestInput,
  BroadcastResponseOutput,
  BroadcastRequestInput,
  BeaconRequestInputMessage,
  Network,
  BeaconError,
  Origin,
  PostMessageTransport,
  PeerInfo,
  Transport,
  DappP2PTransport,
  DappPostMessageTransport,
  PeerManager,
  AppMetadataManager,
  AppMetadata
} from '../..'
import { messageEvents } from '../../beacon-message-events'
import { IgnoredRequestInputProperties } from '../../types/beacon/messages/BeaconRequestInputMessage'
import { getAccountIdentifier } from '../../utils/get-account-identifier'
import { BlockExplorer } from '../../utils/block-explorer'
import { TezblockBlockExplorer } from '../../utils/tezblock-blockexplorer'
import { BeaconErrorType } from '../../types/BeaconErrorType'
import { AlertButton } from '../../ui/alert/Alert'
import { ExtendedP2PPairingResponse } from '../../types/P2PPairingResponse'
import {
  ExtendedPostMessagePairingResponse,
  PostMessagePairingResponse
} from '../../types/PostMessagePairingResponse'
import { getSenderId } from '../../utils/get-sender-id'
import { SigningType } from '../../types/beacon/SigningType'
import { ExtendedPeerInfo } from '../../types/PeerInfo'
import { ColorMode } from '../../types/ColorMode'
import { getColorMode, setColorMode } from '../../colorMode'
import { desktopList, extensionList, iOSList, webList } from '../../ui/alert/wallet-lists'
import { DAppClientOptions } from './DAppClientOptions'

const logger = new Logger('DAppClient')

/**
 * The DAppClient has to be used in decentralized applications. It handles all the logic related to connecting to beacon-compatible
 * wallets and sending requests.
 */
export class DAppClient extends Client {
  /**
   * The block explorer used by the SDK
   */
  public readonly blockExplorer: BlockExplorer

  public preferredNetwork: NetworkType

  protected postMessageTransport: DappPostMessageTransport | undefined
  protected p2pTransport: DappP2PTransport | undefined

  /**
   * A map of requests that are currently "open", meaning we have sent them to a wallet and are still awaiting a response.
   */
  private readonly openRequests = new Map<
    string,
    ExposedPromise<{ message: BeaconMessage; connectionInfo: ConnectionContext }, ErrorResponse>
  >()

  /**
   * The currently active account. For all requests that are associated to a specific request (operation request, signing request),
   * the active account is used to determine the network and destination wallet
   */
  private _activeAccount: ExposedPromise<AccountInfo | undefined> = new ExposedPromise()

  /**
   * The currently active peer. This is used to address a peer in case the active account is not set. (Eg. for permission requests)
   */
  private _activePeer: ExposedPromise<
    ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse | undefined
  > = new ExposedPromise()

  private _initPromise: Promise<TransportType> | undefined

  private readonly activePeerLoaded: Promise<void>
  private readonly activeAccountLoaded: Promise<void>

  private readonly appMetadataManager: AppMetadataManager

  constructor(config: DAppClientOptions) {
    super({
      storage: config && config.storage ? config.storage : new LocalStorage(),
      ...config
    })
    this.blockExplorer = config.blockExplorer ?? new TezblockBlockExplorer()
    this.preferredNetwork = config.preferredNetwork ?? NetworkType.MAINNET
    setColorMode(config.colorMode ?? ColorMode.LIGHT)

    this.appMetadataManager = new AppMetadataManager(this.storage)

    this.activeAccountLoaded = this.storage
      .get(StorageKey.ACTIVE_ACCOUNT)
      .then(async (activeAccountIdentifier) => {
        if (activeAccountIdentifier) {
          await this.setActiveAccount(await this.accountManager.getAccount(activeAccountIdentifier))
        } else {
          await this.setActiveAccount(undefined)
        }
      })
      .catch(async (storageError) => {
        await this.setActiveAccount(undefined)
        console.error(storageError)
      })

    this.activePeerLoaded = this.storage
      .get(StorageKey.ACTIVE_PEER)
      .then(async (activePeerPublicKey) => {
        if (activePeerPublicKey) {
          const p2pPeerManager = new PeerManager(this.storage, StorageKey.TRANSPORT_P2P_PEERS_DAPP)
          const postmessagePeerManager = new PeerManager(
            this.storage,
            StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP
          )
          const peer =
            (await p2pPeerManager.getPeer(activePeerPublicKey)) ??
            (await postmessagePeerManager.getPeer(activePeerPublicKey))
          await this.setActivePeer(peer as any)
        } else {
          await this.setActivePeer(undefined)
        }
      })
      .catch(async (storageError) => {
        await this.setActiveAccount(undefined)
        logger.error(storageError)
      })

    this.handleResponse = async (
      message: BeaconMessage,
      connectionInfo: ConnectionContext
    ): Promise<void> => {
      const openRequest = this.openRequests.get(message.id)

      logger.log('handleResponse', 'Received message', message, connectionInfo)

      if (message.type === BeaconMessageType.Acknowledge) {
        logger.log(`acknowledge message received for ${message.id}`)
        console.timeLog(message.id, 'acknowledge')

        this.events
          .emit(BeaconEvent.ACKNOWLEDGE_RECEIVED, {
            message,
            extraInfo: {},
            walletInfo: await this.getWalletInfo()
          })
          .catch(console.error)
      } else if (openRequest) {
        if (message.type === BeaconMessageType.PermissionResponse && message.appMetadata) {
          await this.appMetadataManager.addAppMetadata(message.appMetadata)
        }

        console.timeLog(message.id, 'response')
        console.timeEnd(message.id)

        if (message.type === BeaconMessageType.Error || (message as any).errorType) {
          // TODO: Remove "any" once we remove support for v1 wallets
          openRequest.reject(message as any)
        } else {
          openRequest.resolve({ message, connectionInfo })
        }
        this.openRequests.delete(message.id)
      } else {
        if (message.type === BeaconMessageType.Disconnect) {
          const relevantTransport =
            connectionInfo.origin === Origin.P2P
              ? this.p2pTransport
              : this.postMessageTransport ?? (await this.transport)

          if (relevantTransport) {
            // TODO: Handle removing it from the right transport (if it was received from the non-active transport)
            const peers: ExtendedPeerInfo[] = await relevantTransport.getPeers()
            const peer: ExtendedPeerInfo | undefined = peers.find(
              (peerEl) => peerEl.senderId === message.senderId
            )
            if (peer) {
              await relevantTransport.removePeer(peer as any)
              await this.removeAccountsForPeers([peer])
              await this.events.emit(BeaconEvent.CHANNEL_CLOSED)
            } else {
              logger.error('handleDisconnect', 'cannot find peer for sender ID', message.senderId)
            }
          }
        } else {
          logger.error('handleResponse', 'no request found for id ', message.id)
        }
      }
    }
  }

  public async initInternalTransports(): Promise<void> {
    const keyPair = await this.keyPair

    if (this.postMessageTransport || this.p2pTransport) {
      return
    }

    this.postMessageTransport = new DappPostMessageTransport(this.name, keyPair, this.storage)
    await this.addListener(this.postMessageTransport)

    this.p2pTransport = new DappP2PTransport(
      this.name,
      keyPair,
      this.storage,
      this.matrixNodes,
      this.iconUrl,
      this.appUrl
    )
    await this.addListener(this.p2pTransport)
  }

  public async init(transport?: Transport<any>): Promise<TransportType> {
    if (this._initPromise) {
      return this._initPromise
    }

    try {
      await this.activeAccountLoaded
    } catch {
      //
    }
    try {
      await this.activePeerLoaded
    } catch {
      //
    }

    this._initPromise = new Promise(async (resolve) => {
      if (transport) {
        await this.addListener(transport)

        resolve(await super.init(transport))
      } else if (this._transport.isSettled()) {
        await (await this.transport).connect()

        resolve(await super.init(await this.transport))
      } else {
        const activeAccount = await this.getActiveAccount()

        const stopListening = () => {
          if (this.postMessageTransport) {
            this.postMessageTransport.stopListeningForNewPeers().catch(console.error)
          }
          if (this.p2pTransport) {
            this.p2pTransport.stopListeningForNewPeers().catch(console.error)
          }
        }

        await this.initInternalTransports()

        if (!this.postMessageTransport || !this.p2pTransport) {
          return
        }

        this.postMessageTransport.connect().then().catch(console.error)
        this.p2pTransport.connect().then().catch(console.error)

        if (activeAccount && activeAccount.origin) {
          const origin = activeAccount.origin.type
          // Select the transport that matches the active account
          if (origin === Origin.EXTENSION) {
            resolve(await super.init(this.postMessageTransport))
          } else if (origin === Origin.P2P) {
            resolve(await super.init(this.p2pTransport))
          }
        } else {
          const p2pTransport = this.p2pTransport
          const postMessageTransport = this.postMessageTransport

          postMessageTransport
            .listenForNewPeer((peer) => {
              logger.log('init', 'postmessage transport peer connected', peer)
              this.events
                .emit(BeaconEvent.PAIR_SUCCESS, peer)
                .catch((emitError) => console.warn(emitError))

              this.setActivePeer(peer).catch(console.error)
              this.setTransport(this.postMessageTransport).catch(console.error)
              stopListening()
              resolve(TransportType.POST_MESSAGE)
            })
            .catch(console.error)

          p2pTransport
            .listenForNewPeer((peer) => {
              logger.log('init', 'p2p transport peer connected', peer)
              this.events
                .emit(BeaconEvent.PAIR_SUCCESS, peer)
                .catch((emitError) => console.warn(emitError))

              this.setActivePeer(peer).catch(console.error)
              this.setTransport(this.p2pTransport).catch(console.error)
              stopListening()
              resolve(TransportType.P2P)
            })
            .catch(console.error)

          PostMessageTransport.getAvailableExtensions()
            .then(async () => {
              this.events
                .emit(BeaconEvent.PAIR_INIT, {
                  p2pPeerInfo: await p2pTransport.getPairingRequestInfo(),
                  postmessagePeerInfo: await postMessageTransport.getPairingRequestInfo(),
                  preferredNetwork: this.preferredNetwork,
                  abortedHandler: () => {
                    this._initPromise = undefined
                  }
                })
                .catch((emitError) => console.warn(emitError))
            })
            .catch((error) => {
              this._initPromise = undefined
              console.error(error)
            })
        }
      }
    })

    return this._initPromise
  }

  /**
   * Returns the active account
   */
  public async getActiveAccount(): Promise<AccountInfo | undefined> {
    return this._activeAccount.promise
  }

  /**
   * Sets the active account
   *
   * @param account The account that will be set as the active account
   */
  public async setActiveAccount(account?: AccountInfo): Promise<void> {
    if (this._activeAccount.isSettled()) {
      // If the promise has already been resolved we need to create a new one.
      this._activeAccount = ExposedPromise.resolve<AccountInfo | undefined>(account)
    } else {
      this._activeAccount.resolve(account)
    }

    if (account) {
      const origin = account.origin.type
      await this.initInternalTransports()

      // Select the transport that matches the active account
      if (origin === Origin.EXTENSION) {
        await this.setTransport(this.postMessageTransport)
      } else if (origin === Origin.P2P) {
        await this.setTransport(this.p2pTransport)
      }
      const peer = await this.getPeer(account)
      await this.setActivePeer(peer as any)
    } else {
      await this.setActivePeer(undefined)
      await this.setTransport(undefined)
    }

    await this.storage.set(
      StorageKey.ACTIVE_ACCOUNT,
      account ? account.accountIdentifier : undefined
    )

    await this.events.emit(BeaconEvent.ACTIVE_ACCOUNT_SET, account)

    return
  }

  /**
   * Clear the active account
   */
  public clearActiveAccount(): Promise<void> {
    return this.setActiveAccount()
  }

  public async setColorMode(colorMode: ColorMode): Promise<void> {
    return setColorMode(colorMode)
  }

  public async getColorMode(): Promise<ColorMode> {
    return getColorMode()
  }

  /**
   * @deprecated
   *
   * Use getOwnAppMetadata instead
   */
  public async getAppMetadata(): Promise<AppMetadata> {
    return this.getOwnAppMetadata()
  }

  /**
   * Will remove the account from the local storage and set a new active account if necessary.
   *
   * @param accountIdentifier ID of the account
   */
  public async removeAccount(accountIdentifier: string): Promise<void> {
    const removeAccountResult = super.removeAccount(accountIdentifier)
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()

    if (activeAccount && activeAccount.accountIdentifier === accountIdentifier) {
      await this.setActiveAccount(undefined)
    }

    return removeAccountResult
  }

  /**
   * Remove all accounts and set active account to undefined
   */
  public async removeAllAccounts(): Promise<void> {
    await super.removeAllAccounts()
    await this.setActiveAccount(undefined)
  }

  /**
   * Removes a peer and all the accounts that have been connected through that peer
   *
   * @param peer Peer to be removed
   */
  public async removePeer(
    peer: ExtendedPeerInfo,
    sendDisconnectToPeer: boolean = false
  ): Promise<void> {
    const transport = await this.transport

    const removePeerResult = transport.removePeer(peer)

    await this.removeAccountsForPeers([peer])

    if (sendDisconnectToPeer) {
      await this.sendDisconnectToPeer(peer, transport)
    }

    return removePeerResult
  }

  /**
   * Remove all peers and all accounts that have been connected through those peers
   */
  public async removeAllPeers(sendDisconnectToPeers: boolean = false): Promise<void> {
    const transport = await this.transport

    const peers: ExtendedPeerInfo[] = await transport.getPeers()
    const removePeerResult = transport.removeAllPeers()

    await this.removeAccountsForPeers(peers)

    if (sendDisconnectToPeers) {
      const disconnectPromises = peers.map((peer) => this.sendDisconnectToPeer(peer, transport))

      await Promise.all(disconnectPromises)
    }

    return removePeerResult
  }

  /**
   * Allows the user to subscribe to specific events that are fired in the SDK
   *
   * @param internalEvent The event to subscribe to
   * @param eventCallback The callback that will be called when the event occurs
   */
  public async subscribeToEvent<K extends BeaconEvent>(
    internalEvent: K,
    eventCallback: BeaconEventHandlerFunction<BeaconEventType[K]>
  ): Promise<void> {
    await this.events.on(internalEvent, eventCallback)
  }

  /**
   * Check if we have permissions to send the specific message type to the active account.
   * If no active account is set, only permission requests are allowed.
   *
   * @param type The type of the message
   */
  public async checkPermissions(type: BeaconMessageType): Promise<boolean> {
    if (type === BeaconMessageType.PermissionRequest) {
      return true
    }

    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()

    if (!activeAccount) {
      throw await this.sendInternalError('No active account set!')
    }

    const permissions = activeAccount.scopes

    switch (type) {
      case BeaconMessageType.OperationRequest:
        return permissions.includes(PermissionScope.OPERATION_REQUEST)
      case BeaconMessageType.SignPayloadRequest:
        return permissions.includes(PermissionScope.SIGN)
      case BeaconMessageType.BroadcastRequest:
        return true
      default:
        return false
    }
  }

  /**
   * Send a permission request to the DApp. This should be done as the first step. The wallet will respond
   * with an publicKey and permissions that were given. The account returned will be set as the "activeAccount"
   * and will be used for the following requests.
   *
   * @param input The message details we need to prepare the PermissionRequest message.
   */
  public async requestPermissions(
    input?: RequestPermissionInput
  ): Promise<PermissionResponseOutput> {
    const request: PermissionRequestInput = {
      appMetadata: await this.getOwnAppMetadata(),
      type: BeaconMessageType.PermissionRequest,
      network: input && input.network ? input.network : { type: NetworkType.MAINNET },
      scopes:
        input && input.scopes
          ? input.scopes
          : [PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN]
    }

    const { message, connectionInfo } = await this.makeRequest<
      PermissionRequest,
      PermissionResponse
    >(request).catch(async (requestError: ErrorResponse) => {
      throw await this.handleRequestError(request, requestError)
    })

    // TODO: Migration code. Remove sometime after 1.0.0 release.
    const publicKey = message.publicKey || (message as any).pubkey || (message as any).pubKey
    const address = await getAddressFromPublicKey(publicKey)

    const accountInfo: AccountInfo = {
      accountIdentifier: await getAccountIdentifier(address, message.network),
      senderId: message.senderId,
      origin: {
        type: connectionInfo.origin,
        id: connectionInfo.id
      },
      address,
      publicKey,
      network: message.network,
      scopes: message.scopes,
      threshold: message.threshold,
      connectedAt: new Date().getTime()
    }

    await this.accountManager.addAccount(accountInfo)
    await this.setActiveAccount(accountInfo)

    const output: PermissionResponseOutput = {
      ...message,
      address,
      accountInfo
    }

    await this.notifySuccess(request, {
      account: accountInfo,
      output,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    return output
  }

  /**
   * This method will send a "SignPayloadRequest" to the wallet. This method is meant to be used to sign
   * arbitrary data (eg. a string). It will return the signature in the format of "edsig..."
   *
   * @param input The message details we need to prepare the SignPayloadRequest message.
   */
  public async requestSignPayload(
    input: RequestSignPayloadInput
  ): Promise<SignPayloadResponseOutput> {
    if (!input.payload) {
      throw await this.sendInternalError('Payload must be provided')
    }
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
    if (!activeAccount) {
      throw await this.sendInternalError('No active account!')
    }

    const payload = input.payload

    if (typeof payload !== 'string') {
      throw new Error('Payload must be a string')
    }

    const signingType = ((): SigningType => {
      switch (input.signingType) {
        case SigningType.OPERATION:
          if (payload.startsWith('03')) {
            throw new Error(
              'When using singing type "OPERATION", the payload must start with prefix "03"'
            )
          }

          return SigningType.OPERATION

        case SigningType.MICHELINE:
          if (payload.startsWith('05')) {
            throw new Error(
              'When using singing type "MICHELINE", the payload must start with prefix "05"'
            )
          }

          return SigningType.MICHELINE

        case SigningType.RAW:
        default:
          return SigningType.RAW
      }
    })()

    const request: SignPayloadRequestInput = {
      type: BeaconMessageType.SignPayloadRequest,
      signingType,
      payload,
      sourceAddress: input.sourceAddress || activeAccount.address
    }

    const { message, connectionInfo } = await this.makeRequest<
      SignPayloadRequest,
      SignPayloadResponse
    >(request).catch(async (requestError: ErrorResponse) => {
      throw await this.handleRequestError(request, requestError)
    })

    await this.notifySuccess(request, {
      account: activeAccount,
      output: message,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    return message
  }

  /**
   * This method sends an OperationRequest to the wallet. This method should be used for all kinds of operations,
   * eg. transaction or delegation. Not all properties have to be provided. Data like "counter" and fees will be
   * fetched and calculated by the wallet (but they can still be provided if required).
   *
   * @param input The message details we need to prepare the OperationRequest message.
   */
  public async requestOperation(input: RequestOperationInput): Promise<OperationResponseOutput> {
    if (!input.operationDetails) {
      throw await this.sendInternalError('Operation details must be provided')
    }
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
    if (!activeAccount) {
      throw await this.sendInternalError('No active account!')
    }

    const request: OperationRequestInput = {
      type: BeaconMessageType.OperationRequest,
      network: activeAccount.network || { type: NetworkType.MAINNET },
      operationDetails: input.operationDetails,
      sourceAddress: activeAccount.address || ''
    }

    const { message, connectionInfo } = await this.makeRequest<OperationRequest, OperationResponse>(
      request
    ).catch(async (requestError: ErrorResponse) => {
      throw await this.handleRequestError(request, requestError)
    })

    await this.notifySuccess(request, {
      account: activeAccount,
      output: message,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    return message
  }

  /**
   * Sends a "BroadcastRequest" to the wallet. This method can be used to inject an already signed transaction
   * to the network.
   *
   * @param input The message details we need to prepare the BroadcastRequest message.
   */
  public async requestBroadcast(input: RequestBroadcastInput): Promise<BroadcastResponseOutput> {
    if (!input.signedTransaction) {
      throw await this.sendInternalError('Signed transaction must be provided')
    }

    const network = input.network || { type: NetworkType.MAINNET }

    const request: BroadcastRequestInput = {
      type: BeaconMessageType.BroadcastRequest,
      network,
      signedTransaction: input.signedTransaction
    }

    const { message, connectionInfo } = await this.makeRequest<BroadcastRequest, BroadcastResponse>(
      request
    ).catch(async (requestError: ErrorResponse) => {
      throw await this.handleRequestError(request, requestError)
    })

    await this.notifySuccess(request, {
      network,
      output: message,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    return message
  }

  protected async setActivePeer(
    peer?: ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse
  ): Promise<void> {
    if (this._activePeer.isSettled()) {
      // If the promise has already been resolved we need to create a new one.
      this._activePeer = ExposedPromise.resolve<
        ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse | undefined
      >(peer)
    } else {
      this._activePeer.resolve(peer)
    }

    if (peer) {
      await this.initInternalTransports()
      if (peer.type === 'postmessage-pairing-response') {
        await this.setTransport(this.postMessageTransport)
      } else if (peer.type === 'p2p-pairing-response') {
        await this.setTransport(this.p2pTransport)
      }
    }

    await this.storage.set(StorageKey.ACTIVE_PEER, peer ? peer.publicKey : undefined)

    return
  }

  /**
   * A "setter" for when the transport needs to be changed.
   */
  protected async setTransport(transport?: Transport<any>): Promise<void> {
    if (!transport) {
      this._initPromise = undefined
    }

    return super.setTransport(transport)
  }

  /**
   * This method will emit an internal error message.
   *
   * @param errorMessage The error message to send.
   */
  private async sendInternalError(errorMessage: string): Promise<void> {
    await this.events.emit(BeaconEvent.INTERNAL_ERROR, errorMessage)
    throw new Error(errorMessage)
  }

  /**
   * This method will remove all accounts associated with a specific peer.
   *
   * @param peersToRemove An array of peers for which accounts should be removed
   */
  private async removeAccountsForPeers(peersToRemove: ExtendedPeerInfo[]): Promise<void> {
    const accounts = await this.accountManager.getAccounts()

    const peerIdsToRemove = peersToRemove.map((peer) => peer.senderId)
    // Remove all accounts with origin of the specified peer
    const accountsToRemove = accounts.filter((account) =>
      peerIdsToRemove.includes(account.senderId)
    )
    const accountIdentifiersToRemove = accountsToRemove.map(
      (accountInfo) => accountInfo.accountIdentifier
    )
    await this.accountManager.removeAccounts(accountIdentifiersToRemove)

    // Check if one of the accounts that was removed was the active account and if yes, set it to undefined
    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()

    if (activeAccount) {
      if (accountIdentifiersToRemove.includes(activeAccount.accountIdentifier)) {
        await this.setActiveAccount(undefined)
      }
    }
  }

  /**
   * This message handles errors that we receive from the wallet.
   *
   * @param request The request we sent
   * @param beaconError The error we received
   */
  private async handleRequestError(
    request: BeaconRequestInputMessage,
    beaconError: ErrorResponse
  ): Promise<void> {
    logger.error('handleRequestError', 'error response', beaconError)
    if (beaconError.errorType) {
      const buttons: AlertButton[] = []
      if (beaconError.errorType === BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR) {
        const actionCallback = async (): Promise<void> => {
          const operationRequest: OperationRequestInput = request as OperationRequestInput
          // if the account we requested is not available, we remove it locally
          let accountInfo: AccountInfo | undefined
          if (operationRequest.sourceAddress && operationRequest.network) {
            const accountIdentifier = await getAccountIdentifier(
              operationRequest.sourceAddress,
              operationRequest.network
            )
            accountInfo = await this.getAccount(accountIdentifier)

            if (accountInfo) {
              await this.removeAccount(accountInfo.accountIdentifier)
            }
          }
        }

        buttons.push({ text: 'Remove account', actionCallback })
      }

      const peer = await this.getPeer()
      const activeAccount = await this.getActiveAccount()

      this.events
        .emit(
          messageEvents[request.type].error,
          { errorResponse: beaconError, walletInfo: await this.getWalletInfo(peer, activeAccount) },
          buttons
        )
        .catch((emitError) => logger.error('handleRequestError', emitError))

      throw BeaconError.getError(beaconError.errorType, beaconError.errorData)
    }

    throw beaconError
  }

  /**
   * This message will send an event when we receive a successful response to one of the requests we sent.
   *
   * @param request The request we sent
   * @param response The response we received
   */
  private async notifySuccess(
    request: BeaconRequestInputMessage,
    response:
      | {
          account: AccountInfo
          output: PermissionResponseOutput
          blockExplorer: BlockExplorer
          connectionContext: ConnectionContext
          walletInfo: WalletInfo
        }
      | {
          account: AccountInfo
          output: OperationResponseOutput
          blockExplorer: BlockExplorer
          connectionContext: ConnectionContext
          walletInfo: WalletInfo
        }
      | {
          output: SignPayloadResponseOutput
          connectionContext: ConnectionContext
          walletInfo: WalletInfo
        }
      | {
          network: Network
          output: BroadcastResponseOutput
          blockExplorer: BlockExplorer
          connectionContext: ConnectionContext
          walletInfo: WalletInfo
        }
  ): Promise<void> {
    this.events
      .emit(messageEvents[request.type].success, response)
      .catch((emitError) => console.warn(emitError))
  }

  private async getWalletInfo(peer?: PeerInfo, account?: AccountInfo): Promise<WalletInfo> {
    const selectedAccount = account ? account : await this.getActiveAccount()

    const selectedPeer = peer ? peer : await this.getPeer(selectedAccount)

    let walletInfo: WalletInfo | undefined
    if (selectedAccount) {
      walletInfo = await this.appMetadataManager.getAppMetadata(selectedAccount.senderId)
    }

    const typedPeer: PostMessagePairingResponse = selectedPeer as any

    if (!walletInfo) {
      walletInfo = {
        name: typedPeer.name,
        icon: typedPeer.icon
      }
    }

    // TODO: Remove once all wallets send the icon?
    const selectedApp =
      iOSList.find((app) => app.name === walletInfo?.name) ??
      webList.find((app) => app.name === walletInfo?.name) ??
      desktopList.find((app) => app.name === walletInfo?.name) ??
      extensionList.find((app) => app.name === walletInfo?.name)

    if (selectedApp) {
      return {
        name: walletInfo.name,
        icon: walletInfo.icon ?? selectedApp.logo
      }
    }

    return walletInfo
  }

  private async getPeer(account?: AccountInfo): Promise<PeerInfo> {
    let peer: PeerInfo | undefined

    if (account) {
      logger.log('', 'We have an account', account)
      const postMessagePeers: ExtendedPostMessagePairingResponse[] =
        (await this.postMessageTransport?.getPeers()) ?? []
      const p2pPeers: ExtendedP2PPairingResponse[] = (await this.p2pTransport?.getPeers()) ?? []
      const peers = [...postMessagePeers, ...p2pPeers]

      logger.log('', 'Found peers', peers, account)

      peer = peers.find((peerEl) => peerEl.senderId === account.senderId)
      if (!peer) {
        // We could not find an exact match for a sender, so we most likely received it over a relay
        peer = peers.find((peerEl) => (peerEl as any).extensionId === account.origin.id)
      }
    } else {
      peer = await this._activePeer.promise
      logger.log('', 'Active peer', peer)
    }

    if (!peer) {
      throw new Error('No matching peer found.')
    }

    return peer
  }

  /**
   * This method handles sending of requests to the DApp. It makes sure that the DAppClient is initialized and connected
   * to the transport. After that rate limits and permissions will be checked, an ID is attached and the request is sent
   * to the DApp over the transport.
   *
   * @param requestInput The BeaconMessage to be sent to the wallet
   * @param account The account that the message will be sent to
   */
  private async makeRequest<T extends BeaconRequestInputMessage, U extends BeaconMessage>(
    requestInput: Omit<T, IgnoredRequestInputProperties>
  ): Promise<{
    message: U
    connectionInfo: ConnectionContext
  }> {
    const messageId = await generateGUID()
    console.time(messageId)
    logger.log('makeRequest', 'starting')
    await this.init()
    console.timeLog(messageId, 'init done')
    logger.log('makeRequest', 'after init')

    if (await this.addRequestAndCheckIfRateLimited()) {
      this.events
        .emit(BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch((emitError) => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    if (!(await this.checkPermissions(requestInput.type))) {
      this.events.emit(BeaconEvent.NO_PERMISSIONS).catch((emitError) => console.warn(emitError))

      throw new Error('No permissions to send this request to wallet!')
    }

    if (!this.beaconId) {
      throw await this.sendInternalError('BeaconID not defined')
    }

    const request: Omit<T, IgnoredRequestInputProperties> &
      Pick<U, IgnoredRequestInputProperties> = {
      id: messageId,
      version: BEACON_VERSION,
      senderId: await getSenderId(await this.beaconId),
      ...requestInput
    }

    const exposed = new ExposedPromise<
      { message: BeaconMessage; connectionInfo: ConnectionContext },
      ErrorResponse
    >()

    this.addOpenRequest(request.id, exposed)

    const payload = await new Serializer().serialize(request)

    const account = await this.getActiveAccount()

    const peer = await this.getPeer(account)

    const walletInfo = await this.getWalletInfo(peer, account)

    console.timeLog(messageId, 'sending')
    await (await this.transport).send(payload, peer)
    console.timeLog(messageId, 'sent')

    this.events
      .emit(messageEvents[requestInput.type].sent, {
        walletInfo: {
          name: walletInfo.name ?? 'Wallet',
          icon: walletInfo.icon
        },
        extraInfo: {
          resetCallback: async () => {
            await this.clearActiveAccount()
          }
        }
      })
      .catch((emitError) => console.warn(emitError))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return exposed.promise as any // TODO: fix type
  }

  /**
   * Adds a requests to the "openRequests" set so we know what messages have already been answered/handled.
   *
   * @param id The ID of the message
   * @param promise A promise that resolves once the response for that specific message is received
   */
  private addOpenRequest(
    id: string,
    promise: ExposedPromise<
      { message: BeaconMessage; connectionInfo: ConnectionContext },
      ErrorResponse
    >
  ): void {
    logger.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`)
    this.openRequests.set(id, promise)
  }
}
