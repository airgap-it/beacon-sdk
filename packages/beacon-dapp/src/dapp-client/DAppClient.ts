import axios from 'axios'
import bs58check from 'bs58check'
import { BeaconEvent, BeaconEventHandlerFunction, BeaconEventType } from '../events'
import {
  ConnectionContext,
  AccountInfo,
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
  Origin,
  PeerInfo,
  BeaconErrorType,
  AppMetadata,
  ExtendedP2PPairingResponse,
  ExtendedPostMessagePairingResponse,
  SigningType,
  ExtendedPeerInfo,
  Optional,
  ColorMode,
  IgnoredRequestInputProperties,
  WalletInfo,
  BeaconMessageWrapper,
  Blockchain,
  BlockchainMessage,
  BlockchainRequestV3,
  BlockchainResponseV3,
  PermissionRequestV3,
  PermissionResponseV3,
  BeaconBaseMessage,
  AcknowledgeResponse,
  ExtendedWalletConnectPairingResponse,
  ProofOfEventChallengeRequest,
  ProofOfEventChallengeResponse,
  ProofOfEventChallengeRequestInput,
  RequestProofOfEventChallengeInput,
  ChangeAccountRequest,
  PeerInfoType,
  App,
  AppBase,
  DesktopApp,
  ExtensionApp,
  WebApp,
  SimulatedProofOfEventChallengeRequestInput,
  SimulatedProofOfEventChallengeRequest,
  SimulatedProofOfEventChallengeResponse,
  RequestSimulatedProofOfEventChallengeInput,
  TransportStatus
  // PermissionRequestV3
  // RequestEncryptPayloadInput,
  // EncryptPayloadResponseOutput,
  // EncryptPayloadResponse,
  // EncryptPayloadRequest
} from '@airgap/beacon-types'
import {
  Client,
  Transport,
  AppMetadataManager,
  Serializer,
  LocalStorage,
  getAccountIdentifier,
  getSenderId,
  Logger,
  ClientEvents,
  StorageValidator,
  SDK_VERSION,
  IndexedDBStorage,
  MultiTabChannel,
  BACKEND_URL,
  getError
} from '@airgap/beacon-core'
import {
  getAddressFromPublicKey,
  ExposedPromise,
  generateGUID,
  toHex,
  signMessage,
  CONTRACT_PREFIX,
  prefixPublicKey,
  isValidAddress,
  getKeypairFromSeed
} from '@airgap/beacon-utils'
import { messageEvents } from '../beacon-message-events'
import { BlockExplorer } from '../utils/block-explorer'
import { TzktBlockExplorer } from '../utils/tzkt-blockexplorer'

import { DAppClientOptions } from './DAppClientOptions'
import { BeaconEventHandler } from '@airgap/beacon-dapp'
import { DappPostMessageTransport } from '../transports/DappPostMessageTransport'
import { DappP2PTransport } from '../transports/DappP2PTransport'
import { DappWalletConnectTransport } from '../transports/DappWalletConnectTransport'
import { PostMessageTransport } from '@airgap/beacon-transport-postmessage'
import {
  AlertButton,
  closeToast,
  getColorMode,
  setColorMode,
  setDesktopList,
  setExtensionList,
  setWebList,
  setiOSList,
  getiOSList,
  getDesktopList,
  getExtensionList,
  getWebList,
  isBrowser,
  isDesktop,
  isMobileOS,
  isIOS,
  currentOS
} from '@airgap/beacon-ui'
import { WalletConnectTransport } from '@airgap/beacon-transport-walletconnect'

const logger = new Logger('DAppClient')

/**
 * @publicapi
 *
 * The DAppClient has to be used in decentralized applications. It handles all the logic related to connecting to beacon-compatible
 * wallets and sending requests.
 *
 * @category DApp
 */
export class DAppClient extends Client {
  /**
   * The description of the app
   */
  public readonly description?: string

  /**
   * The block explorer used by the SDK
   */
  public readonly blockExplorer: BlockExplorer

  /**
   * Automatically switch between apps on Mobile Devices (Enabled by Default)
   */
  private enableAppSwitching: boolean

  /**
   * Enable metrics tracking (Disabled by Default)
   */
  private enableMetrics?: boolean

  private userId?: string

  public network: Network

  protected readonly events: BeaconEventHandler = new BeaconEventHandler()

  protected postMessageTransport: DappPostMessageTransport | undefined
  protected p2pTransport: DappP2PTransport | undefined
  protected walletConnectTransport: DappWalletConnectTransport | undefined

  protected wcProjectId?: string
  protected wcRelayUrl?: string

  private isGetActiveAccountHandled: boolean = false

  private readonly openRequestsOtherTabs = new Set<string>()
  /**
   * A map of requests that are currently "open", meaning we have sent them to a wallet and are still awaiting a response.
   */
  private readonly openRequests = new Map<
    string,
    ExposedPromise<
      {
        message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
        connectionInfo: ConnectionContext
      },
      ErrorResponse
    >
  >()

  /**
   * The currently active account. For all requests that are associated to a specific request (operation request, signing request),
   * the active account is used to determine the network and destination wallet
   */
  private _activeAccount: ExposedPromise<AccountInfo | undefined> = new ExposedPromise()

  /**
   * The currently active peer. This is used to address a peer in case the active account is not set. (Eg. for permission requests)
   */
  private _activePeer: ExposedPromise<PeerInfoType | undefined> = new ExposedPromise()

  private _initPromise: Promise<TransportType> | undefined

  private isInitPending: boolean = false

  private readonly activeAccountLoaded: Promise<AccountInfo | undefined>

  private readonly appMetadataManager: AppMetadataManager

  private readonly disclaimerText?: string

  private readonly errorMessages: Record<string, Record<string | number, string>>

  private readonly featuredWallets: string[] | undefined

  private readonly storageValidator: StorageValidator

  private readonly beaconIDB = new IndexedDBStorage('beacon', ['bug_report', 'metrics'])

  private debounceSetActiveAccount: boolean = false

  private multiTabChannel = new MultiTabChannel(
    'beacon-sdk-channel',
    this.onBCMessageHandler.bind(this),
    this.onElectedLeaderhandler.bind(this)
  )

  constructor(config: DAppClientOptions) {
    super({
      storage: config && config.storage ? config.storage : new LocalStorage(),
      ...config
    })
    this.description = config.description
    this.wcProjectId = config.walletConnectOptions?.projectId || '24469fd0a06df227b6e5f7dc7de0ff4f'
    this.wcRelayUrl = config.walletConnectOptions?.relayUrl

    this.featuredWallets = config.featuredWallets

    this.events = new BeaconEventHandler(config.eventHandlers, config.disableDefaultEvents ?? false)
    this.blockExplorer = config.blockExplorer ?? new TzktBlockExplorer()
    this.network = config.network ?? { type: config.preferredNetwork ?? NetworkType.MAINNET }
    setColorMode(config.colorMode ?? ColorMode.LIGHT)

    this.disclaimerText = config.disclaimerText

    this.errorMessages = config.errorMessages ?? {}

    this.appMetadataManager = new AppMetadataManager(this.storage)
    this.storageValidator = new StorageValidator(this.storage)

    this.enableAppSwitching =
      config.enableAppSwitching === undefined ? true : !!config.enableAppSwitching

    this.enableMetrics = config.enableMetrics ? true : false

    // Subscribe to storage changes and update the active account if it changes on other tabs
    this.storage.subscribeToStorageChanged(async (event) => {
      if (event.eventType === 'storageCleared') {
        this.setActiveAccount(undefined)
        return
      }
      if (event.eventType === 'entryModified') {
        if (event.key === this.storage.getPrefixedKey(StorageKey.ACTIVE_ACCOUNT)) {
          const accountIdentifier = event.newValue
          if (!accountIdentifier || accountIdentifier === 'undefined') {
            this.setActiveAccount(undefined)
          } else {
            const account = await this.getAccount(accountIdentifier)
            this.setActiveAccount(account)
          }
          return
        }
        if (event.key === this.storage.getPrefixedKey(StorageKey.ENABLE_METRICS)) {
          this.enableMetrics = !!(await this.storage.get(StorageKey.ENABLE_METRICS))
          return
        }
        if (event.key === this.storage.getPrefixedKey(StorageKey.BEACON_SDK_SECRET_SEED)) {
          this._keyPair = new ExposedPromise()
          this._beaconId = new ExposedPromise()
          await this.initSDK()
          return
        }
      }
    })

    this.activeAccountLoaded = this.storage
      .get(StorageKey.ACTIVE_ACCOUNT)
      .then(async (activeAccountIdentifier) => {
        if (activeAccountIdentifier) {
          const account = await this.accountManager.getAccount(activeAccountIdentifier)
          await this.setActiveAccount(account)
          return account
        } else {
          await this.setActiveAccount(undefined)
          return undefined
        }
      })
      .catch(async (storageError) => {
        logger.error(storageError)
        await this.resetInvalidState(false)
        this.events.emit(BeaconEvent.INVALID_ACCOUNT_DEACTIVATED)
        return undefined
      })

    this.handleResponse = async (
      message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>,
      connectionInfo: ConnectionContext
    ): Promise<void> => {
      const typedMessage =
        message.version === '3'
          ? (message as BeaconMessageWrapper<BeaconBaseMessage>).message
          : (message as BeaconMessage)

      let appMetadata: AppMetadata | undefined =
        message.version === '3'
          ? (typedMessage as unknown as PermissionResponseV3<string>).blockchainData?.appMetadata
          : (typedMessage as PermissionResponse).appMetadata

      if (!appMetadata && message.version === '3') {
        const storedMetadata = await Promise.all([
          this.storage.get(StorageKey.TRANSPORT_P2P_PEERS_DAPP),
          this.storage.get(StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP),
          this.storage.get(StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP)
        ])

        for (const peers of storedMetadata) {
          const peer: any = peers.find((peer: any) => peer.senderId === message.senderId)
          if (!peer) {
            continue
          }

          const wallet = await this.getWalletInfo()

          appMetadata = {
            name: peer.name,
            senderId: peer.senderId,
            icon: wallet.icon
          }

          break
        }
      }

      if (this.openRequestsOtherTabs.has(message.id)) {
        this.multiTabChannel.postMessage({
          type: 'RESPONSE',
          data: {
            message,
            connectionInfo
          },
          id: message.id
        })

        if (typedMessage.type !== BeaconMessageType.Acknowledge) {
          this.openRequestsOtherTabs.delete(message.id)
        }

        return
      }

      const openRequest = this.openRequests.get(message.id)

      logger.log('### openRequest ###', openRequest)
      logger.log('handleResponse', 'Received message', message, connectionInfo)
      logger.log('### message ###', JSON.stringify(message))
      logger.log('### connectionInfo ###', connectionInfo)

      const handleDisconnect = async (): Promise<void> => {
        this.analytics.track('event', 'DAppClient', 'Disconnect received from Wallet')

        const relevantTransport =
          connectionInfo.origin === Origin.P2P
            ? this.p2pTransport
            : connectionInfo.origin === Origin.WALLETCONNECT
              ? this.walletConnectTransport
              : (this.postMessageTransport ?? (await this.transport))

        if (relevantTransport) {
          const peers: ExtendedPeerInfo[] = await relevantTransport.getPeers()
          const peer: ExtendedPeerInfo | undefined = peers.find(
            (peerEl) => peerEl.senderId === message.senderId
          )

          if (peer) {
            await relevantTransport.removePeer(peer)
          }
        }

        await this.removeAccountsForPeerIds([message.senderId])
        await this.events.emit(BeaconEvent.CHANNEL_CLOSED)
      }

      if (openRequest && typedMessage.type === BeaconMessageType.Acknowledge) {
        this.analytics.track('event', 'DAppClient', 'Acknowledge received from Wallet')
        logger.log('handleResponse', `acknowledge message received for ${message.id}`)

        this.events
          .emit(BeaconEvent.ACKNOWLEDGE_RECEIVED, {
            message: typedMessage as AcknowledgeResponse,
            extraInfo: {},
            walletInfo: await this.getWalletInfo()
          })
          .catch(console.error)
      } else if (openRequest) {
        if (typedMessage.type === BeaconMessageType.PermissionResponse && appMetadata) {
          await this.appMetadataManager.addAppMetadata(appMetadata)
        }

        if (typedMessage.type === BeaconMessageType.Error) {
          openRequest.reject(typedMessage as ErrorResponse)
        } else {
          openRequest.resolve({ message, connectionInfo })
        }
        this.openRequests.delete(typedMessage.id)
      } else {
        if (typedMessage.type === BeaconMessageType.Disconnect) {
          await handleDisconnect()
        } else if (typedMessage.type === BeaconMessageType.ChangeAccountRequest) {
          await this.onNewAccount(typedMessage as ChangeAccountRequest, connectionInfo)
        }
      }

      if (this._transport.isResolved()) {
        const transport = await this.transport

        if (
          transport instanceof WalletConnectTransport &&
          !this.openRequests.has('session_update')
        ) {
          this.openRequests.set('session_update', new ExposedPromise())
        }
      }
    }

    this.storageValidator
      .validate()
      .then(async (isValid) => {
        const account = await this.activeAccountLoaded

        if (!isValid) {
          const info = await this.getWalletInfo(undefined, account, false)
          info.type =
            info.type === 'extension' && account?.origin.type === Origin.P2P ? 'mobile' : info.type
          await this.storage.set(StorageKey.LAST_SELECTED_WALLET, {
            icon: info.icon ?? '',
            key: info.name,
            type: info.type ?? 'web',
            name: info.name,
            url: info.deeplink
          })

          const nowValid = await this.storageValidator.validate()

          if (!nowValid) {
            this.resetInvalidState(false)
          }
        }

        if (account && account.origin.type !== 'p2p') {
          this.init()
        }
      })
      .catch((err) => logger.error(err.message))

    this.sendMetrics(
      'enable-metrics?' + this.addQueryParam('version', SDK_VERSION),
      undefined,
      (res) => {
        if (!res.ok) {
          res.status === 426
            ? console.error('Metrics are no longer supported for this version, please upgrade.')
            : console.warn(
                'Network error encountered. Metrics sharing have been automatically disabled.'
              )
        }
        this.enableMetrics = res.ok
        this.storage.set(StorageKey.ENABLE_METRICS, res.ok)
      },
      () => {
        this.enableMetrics = false
        this.storage.set(StorageKey.ENABLE_METRICS, false)
      }
    )

    this.initUserID().catch((err) => logger.error(err.message))
  }

  private async checkIfBCLeaderExists() {
    // broadcast channel does not work on mobile
    if (isMobileOS(window)) {
      return true
    }

    const hasLeader = await this.multiTabChannel.hasLeader()

    if (hasLeader) {
      return this.multiTabChannel.isLeader()
    }

    await this.multiTabChannel.getLeadership()

    return this.multiTabChannel.isLeader()
  }

  private async onElectedLeaderhandler() {
    if (!this._transport.isResolved()) {
      return
    }

    const tranport = await this.transport

    if (tranport.type !== TransportType.WALLETCONNECT) {
      return
    }

    if (tranport.connectionStatus === TransportStatus.CONNECTED) {
      return
    }

    await tranport.connect()
  }

  private async onBCMessageHandler(message: any) {
    switch (message.type) {
      case BeaconMessageType.PermissionRequest:
      case BeaconMessageType.OperationRequest:
      case BeaconMessageType.SignPayloadRequest:
      case BeaconMessageType.BroadcastRequest:
      case BeaconMessageType.ProofOfEventChallengeRequest:
      case BeaconMessageType.SimulatedProofOfEventChallengeRequest:
        this.prepareRequest(message)
        break
      case BeaconMessageType.BlockchainRequest:
        this.prepareRequest(message, true)
        break
      case 'RESPONSE':
        this.handleResponse(message.data.message, message.data.connectionInfo)
        break
      case 'DISCONNECT':
        this._transport.isResolved() && this.disconnect()
        break
      default:
        logger.error('onBCMessageHandler', 'message type not recognized', message)
    }
  }

  private async prepareRequest(message: any, isV3 = false) {
    if (!this.multiTabChannel.isLeader()) {
      return
    }

    // block until the transport is ready
    const transport = (await this._transport.promise) as DappWalletConnectTransport
    await transport.waitForResolution()

    this.openRequestsOtherTabs.add(message.id)
    isV3
      ? this.makeRequestV3(message.data, message.id)
      : this.makeRequest(message.data, false, message.id)
  }

  private async createStateSnapshot() {
    if (!localStorage || !this.enableMetrics) {
      return
    }
    const keys = Object.values(StorageKey).filter(
      (key) => !key.includes('wc@2') && !key.includes('secret') && !key.includes('account')
    ) as unknown as StorageKey[]

    try {
      for (const key of keys) {
        await this.beaconIDB.set(key, this.storage.getPrefixedKey(key))
      }
    } catch (err: any) {
      logger.error('createStateSnapshot', err.message)
    }
  }

  private async initUserID() {
    const id = await this.storage.get(StorageKey.USER_ID)

    if (id) {
      this.userId = id
      return
    }

    this.userId = await generateGUID()

    this.storage.set(StorageKey.USER_ID, this.userId)
  }

  public async initInternalTransports(): Promise<void> {
    const seed = await this.storage.get(StorageKey.BEACON_SDK_SECRET_SEED)
    if (!seed) {
      throw new Error('Secret seed not found')
    }
    const keyPair = await getKeypairFromSeed(seed)

    if (this.postMessageTransport || this.p2pTransport || this.walletConnectTransport) {
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

    const wcOptions = {
      projectId: this.wcProjectId,
      relayUrl: this.wcRelayUrl,
      metadata: {
        name: this.name,
        description: this.description ?? '',
        url: this.appUrl ?? '',
        icons: this.iconUrl ? [this.iconUrl] : []
      }
    }

    this.walletConnectTransport = new DappWalletConnectTransport(
      this.name,
      keyPair,
      this.storage,
      {
        network: this.network.type,
        opts: wcOptions
      },
      this.checkIfBCLeaderExists.bind(this)
    )

    this.initEvents()

    await this.addListener(this.walletConnectTransport)
  }

  private initEvents() {
    if (!this.walletConnectTransport) {
      return
    }

    this.walletConnectTransport.setEventHandler(
      ClientEvents.CLOSE_ALERT,
      this.hideUI.bind(this, ['alert', 'toast'])
    )
    this.walletConnectTransport.setEventHandler(
      ClientEvents.RESET_STATE,
      this.channelClosedHandler.bind(this)
    )
    this.walletConnectTransport.setEventHandler(
      ClientEvents.WC_ACK_NOTIFICATION,
      this.wcToastHandler.bind(this)
    )
    this.walletConnectTransport.setEventHandler(
      ClientEvents.ON_RELAYER_ERROR,
      this.onRelayerError.bind(this)
    )
  }

  private async onRelayerError() {
    await this.resetInvalidState(false)

    this.events.emit(BeaconEvent.RELAYER_ERROR)
  }

  private async wcToastHandler(status: string) {
    const walletInfo = await (async (): Promise<WalletInfo> => {
      try {
        return await this.getWalletInfo()
      } catch {
        return { name: 'wallet' }
      }
    })()

    await this.events.emit(BeaconEvent.HIDE_UI, ['alert'])
    if (status === 'pending') {
      this.events.emit(BeaconEvent.ACKNOWLEDGE_RECEIVED, {
        message: {} as any,
        extraInfo: {} as any,
        walletInfo
      })
    } else {
      this.events.emit(BeaconEvent.PERMISSION_REQUEST_ERROR, {
        errorResponse: { errorType: BeaconErrorType.ABORTED_ERROR } as any,
        walletInfo
      })
    }
  }
  private async channelClosedHandler(type: TransportType) {
    const transport = await this.transport

    if (transport.type !== type) {
      return
    }

    await this.events.emit(BeaconEvent.CHANNEL_CLOSED)
    this.setActiveAccount(undefined)
    await this.disconnect()
  }

  /**
   * Destroy the instance.
   *
   * WARNING: Call `destroy` whenever you no longer need dAppClient
   * as it frees internal subscriptions to the transport and therefore the instance may no longer work properly.
   * If you wish to disconnect your dApp, use `disconnect` instead.
   */
  async destroy(): Promise<void> {
    await this.createStateSnapshot()
    await super.destroy()
  }

  public async init(transport?: Transport<any>, displayQRCode?: boolean): Promise<TransportType> {
    if (this._initPromise) {
      return this._initPromise
    }

    try {
      await this.activeAccountLoaded
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
          if (this.walletConnectTransport) {
            this.walletConnectTransport.stopListeningForNewPeers().catch(console.error)
          }
        }

        await this.initInternalTransports()

        if (!this.postMessageTransport || !this.p2pTransport || !this.walletConnectTransport) {
          return
        }

        this.postMessageTransport.connect().then().catch(console.error)

        if (activeAccount && activeAccount.origin) {
          const origin = activeAccount.origin.type
          // Select the transport that matches the active account
          if (origin === Origin.EXTENSION) {
            resolve(await super.init(this.postMessageTransport))
          } else if (origin === Origin.P2P) {
            resolve(await super.init(this.p2pTransport))
          } else if (origin === Origin.WALLETCONNECT) {
            resolve(await super.init(this.walletConnectTransport))
          }
        } else {
          const p2pTransport = this.p2pTransport
          const postMessageTransport = this.postMessageTransport
          const walletConnectTransport = this.walletConnectTransport

          postMessageTransport
            .listenForNewPeer((peer) => {
              logger.log('init', 'postmessage transport peer connected', peer)
              this.analytics.track('event', 'DAppClient', 'Extension connected', {
                peerName: peer.name
              })
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
              this.analytics.track('event', 'DAppClient', 'Beacon Wallet connected', {
                peerName: peer.name
              })
              this.events
                .emit(BeaconEvent.PAIR_SUCCESS, peer)
                .catch((emitError) => console.warn(emitError))

              this.setActivePeer(peer).catch(console.error)
              this.setTransport(this.p2pTransport).catch(console.error)
              stopListening()
              resolve(TransportType.P2P)
            })
            .catch(console.error)

          walletConnectTransport
            .listenForNewPeer((peer) => {
              logger.log('init', 'walletconnect transport peer connected', peer)
              this.analytics.track('event', 'DAppClient', 'WalletConnect Wallet connected', {
                peerName: peer.name
              })
              this.events
                .emit(BeaconEvent.PAIR_SUCCESS, peer)
                .catch((emitError) => console.warn(emitError))

              this.setActivePeer(peer).catch(console.error)
              this.setTransport(this.walletConnectTransport).catch(console.error)
              stopListening()
              resolve(TransportType.WALLETCONNECT)
            })
            .catch(console.error)

          PostMessageTransport.getAvailableExtensions()
            .then(async (extensions) => {
              this.analytics.track('event', 'DAppClient', 'Extensions detected', { extensions })
            })
            .catch((error) => {
              this._initPromise = undefined
              console.error(error)
            })

          const abortHandler = async () => {
            logger.log('init', 'ABORTED')
            this.sendMetrics(
              'performance-metrics/save',
              await this.buildPayload('connect', 'abort')
            )
            await Promise.all([
              postMessageTransport.disconnect(),
              // p2pTransport.disconnect(), do not abort connection manually
              walletConnectTransport.disconnect()
            ])
            this.postMessageTransport = this.walletConnectTransport = this.p2pTransport = undefined
            this._activeAccount.isResolved() && this.clearActiveAccount()
            this._initPromise = undefined
          }

          const serializer = new Serializer()
          const p2pPeerInfo = new Promise<string>(async (resolve) => {
            try {
              await p2pTransport.connect()
            } catch (err: any) {
              logger.error(err)
              await this.hideUI(['alert']) // hide pairing alert
              setTimeout(() => this.events.emit(BeaconEvent.GENERIC_ERROR, err.message), 1000)
              abortHandler()
              resolve('')
              return
            }
            resolve(await serializer.serialize(await p2pTransport.getPairingRequestInfo()))
          })

          const walletConnectPeerInfo = new Promise<string>(async (resolve) => {
            resolve((await walletConnectTransport.getPairingRequestInfo()).uri)
          })

          const postmessagePeerInfo = new Promise<string>(async (resolve) => {
            resolve(await serializer.serialize(await postMessageTransport.getPairingRequestInfo()))
          })

          this.events
            .emit(BeaconEvent.PAIR_INIT, {
              p2pPeerInfo,
              postmessagePeerInfo,
              walletConnectPeerInfo,
              networkType: this.network.type,
              abortedHandler: abortHandler.bind(this),
              disclaimerText: this.disclaimerText,
              analytics: this.analytics,
              featuredWallets: this.featuredWallets,
              displayQRCode
            })
            .catch((emitError) => console.warn(emitError))
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

  private async isInvalidState(account: AccountInfo) {
    const activeAccount = await this._activeAccount.promise
    return !activeAccount
      ? false
      : activeAccount?.address !== account?.address && !this.isGetActiveAccountHandled
  }

  private async resetInvalidState(emit: boolean = true) {
    this.accountManager.removeAllAccounts()
    this._activeAccount = ExposedPromise.resolve<AccountInfo | undefined>(undefined)
    this.storage.set(StorageKey.ACTIVE_ACCOUNT, undefined)
    emit && this.events.emit(BeaconEvent.INVALID_ACTIVE_ACCOUNT_STATE)
    !emit && this.hideUI(['alert'])
    await Promise.all([
      this.postMessageTransport?.disconnect(),
      this.walletConnectTransport?.disconnect()
    ])
    this.postMessageTransport = this.p2pTransport = this.walletConnectTransport = undefined
    await this.setActivePeer(undefined)
    await this.setTransport(undefined)
    this._initPromise = undefined
  }

  /**
   * Sets the active account
   *
   * @param account The account that will be set as the active account
   */
  public async setActiveAccount(account?: AccountInfo): Promise<void> {
    if (!this.isGetActiveAccountHandled) {
      console.warn(
        `An active account has been received, but no active subscription was found for BeaconEvent.ACTIVE_ACCOUNT_SET.
        For more information, visit: https://docs.walletbeacon.io/guides/migration-guide`
      )
    }

    if (account && this._activeAccount.isSettled() && (await this.isInvalidState(account))) {
      const tranport = await this.transport

      if (tranport instanceof WalletConnectTransport && tranport.wasDisconnectedByWallet()) {
        await this.resetInvalidState()
        return
      }
    }

    // when I'm resetting the activeAccount
    if (!account && this._activeAccount.isResolved() && (await this.getActiveAccount())) {
      const transport = await this.transport
      const activeAccount = await this.getActiveAccount()

      if (!transport || !activeAccount) {
        return
      }

      if (!this.debounceSetActiveAccount && transport instanceof WalletConnectTransport) {
        this.debounceSetActiveAccount = true
        this._initPromise = undefined
        this.postMessageTransport = this.p2pTransport = this.walletConnectTransport = undefined
        if (this.multiTabChannel.isLeader() || isMobileOS(window)) {
          await transport.disconnect()
          this.openRequestsOtherTabs.clear()
        } else {
          this.multiTabChannel.postMessage({
            type: 'DISCONNECT'
          })
        }
        Array.from(this.openRequests.entries())
          .filter(([id, _promise]) => id !== 'session_update')
          .forEach(([id, promise]) => {
            promise.reject({
              type: BeaconMessageType.Error,
              errorType: BeaconErrorType.ABORTED_ERROR,
              id,
              senderId: '',
              version: '2'
            })
          })
        this.openRequests.clear()
        this.debounceSetActiveAccount = false
      }
    }

    if (this._activeAccount.isSettled()) {
      // If the promise has already been resolved we need to create a new one.
      this._activeAccount = ExposedPromise.resolve<AccountInfo | undefined>(account)
    } else {
      this._activeAccount.resolve(account)
    }

    if (!this.isGetActiveAccountHandled && this._transport.isResolved()) {
      const transport = await this.transport

      if (transport instanceof WalletConnectTransport && transport.wasDisconnectedByWallet()) {
        await this.resetInvalidState()
        return
      }
    }

    if (account) {
      const origin = account.origin.type
      await this.initInternalTransports()

      // Select the transport that matches the active account
      if (origin === Origin.EXTENSION) {
        await this.setTransport(this.postMessageTransport)
      } else if (origin === Origin.P2P) {
        await this.setTransport(this.p2pTransport)
      } else if (origin === Origin.WALLETCONNECT) {
        await this.setTransport(this.walletConnectTransport)
        this.walletConnectTransport?.forceUpdate('INIT')
      }
      if (this._transport.isResolved()) {
        const transport = await this.transport

        if (transport.connectionStatus === TransportStatus.NOT_CONNECTED) {
          await transport.connect()
        }
      }
      const peer = await this.getPeer(account)
      await this.setActivePeer(peer)
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

  public async showPrepare(): Promise<void> {
    const walletInfo = await (async () => {
      try {
        return await this.getWalletInfo()
      } catch {
        return undefined
      }
    })()
    await this.events.emit(BeaconEvent.SHOW_PREPARE, { walletInfo })
  }

  public async hideUI(elements: ('alert' | 'toast')[]): Promise<void> {
    await this.events.emit(BeaconEvent.HIDE_UI, elements)
  }

  private async tryToAppSwitch() {
    if (!isMobileOS(window) || !this.enableAppSwitching) {
      return
    }

    const wallet = await this.getWalletInfo()

    if (wallet.type !== 'mobile' || !wallet.deeplink) {
      return
    }

    const link = isIOS(window) ? wallet.deeplink : (`${wallet.deeplink}wc?uri=` as any)

    if (!link?.length) {
      return
    }

    window.location = link
  }

  private addQueryParam(paramName: string, paramValue: string): string {
    return paramName + '=' + paramValue
  }

  private async buildPayload(
    action: 'connect' | 'message' | 'disconnect',
    status: 'start' | 'abort' | 'success' | 'error'
  ): Promise<RequestInit> {
    const wallet = await this.storage.get(StorageKey.LAST_SELECTED_WALLET)
    const transport = this._activeAccount.isResolved()
      ? ((await this.getActiveAccount())?.origin.type ?? 'UNKNOWN')
      : 'UNKNOWN'

    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        os: currentOS(),
        walletName: wallet?.name ?? 'init',
        walletType: wallet?.type ?? 'init',
        sdkVersion: SDK_VERSION,
        transport,
        time: new Date(),
        action,
        status
      })
    }
  }

  private async updateMetricsStorage(payload: string) {
    const queue = await this.beaconIDB.getAllKeys('metrics')

    if (queue.length >= 1000) {
      const key = queue.shift()!
      this.beaconIDB.delete(key.toString(), 'metrics')
    }

    this.beaconIDB.set(String(Date.now()), payload, 'metrics')
  }

  private sendMetrics(
    uri: string,
    options?: RequestInit,
    thenHandler?: (res: Response) => void,
    catchHandler?: (err: Error) => void
  ) {
    if (!this.enableMetrics && uri === 'performance-metrics/save') {
      options && this.updateMetricsStorage(options.body as string)
    }
    if (!this.enableMetrics) {
      return
    }

    fetch(`${BACKEND_URL}/${uri}`, options)
      .then((res) => thenHandler && thenHandler(res))
      .catch((err: Error) => {
        console.warn('Network error encountered. Metrics sharing have been automatically disabled.')
        logger.error(err.message)
        this.enableMetrics = false // in the event of a network error, stop sending metrics
        catchHandler && catchHandler(err)
      })
  }

  private async checkMakeRequest() {
    const isResolved = this._transport.isResolved()
    const isWCInstance = isResolved && (await this.transport) instanceof WalletConnectTransport
    const isLeader = this.multiTabChannel.isLeader()

    return !isResolved || !isWCInstance || isLeader || isMobileOS(window)
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
    if (internalEvent === BeaconEvent.ACTIVE_ACCOUNT_SET) {
      this.isGetActiveAccountHandled = true
    }

    await this.events.on(internalEvent, eventCallback)
  }

  /**
   * Check if we have permissions to send the specific message type to the active account.
   * If no active account is set, only permission requests are allowed.
   *
   * @param type The type of the message
   */
  public async checkPermissions(type: BeaconMessageType): Promise<boolean> {
    if (
      [
        BeaconMessageType.PermissionRequest,
        BeaconMessageType.ProofOfEventChallengeRequest,
        BeaconMessageType.SimulatedProofOfEventChallengeRequest
      ].includes(type)
    ) {
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
      // TODO: ENCRYPTION
      // case BeaconMessageType.EncryptPayloadRequest:
      //   return permissions.includes(PermissionScope.ENCRYPT)
      case BeaconMessageType.BroadcastRequest:
        return true
      default:
        return false
    }
  }

  public async sendNotification(
    title: string,
    message: string,
    payload: string,
    protocolIdentifier: string
  ): Promise<string> {
    const activeAccount = await this.getActiveAccount()

    if (
      !activeAccount ||
      (activeAccount &&
        !activeAccount.scopes.includes(PermissionScope.NOTIFICATION) &&
        !activeAccount.notification)
    ) {
      throw new Error('notification permissions not given')
    }

    if (!activeAccount.notification?.token) {
      throw new Error('No AccessToken')
    }

    const url = activeAccount.notification?.apiUrl

    if (!url) {
      throw new Error('No Push URL set')
    }

    return this.sendNotificationWithAccessToken({
      url,
      recipient: activeAccount.address,
      title,
      body: message,
      payload,
      protocolIdentifier,
      accessToken: activeAccount.notification?.token
    })
  }

  private blockchains: Map<string, Blockchain> = new Map()

  addBlockchain(chain: Blockchain) {
    this.blockchains.set(chain.identifier, chain)
    chain.getWalletLists().then((walletLists) => {
      setDesktopList(walletLists.desktopList)
      setExtensionList(walletLists.extensionList)
      setWebList(walletLists.webList)
      setiOSList(walletLists.iOSList)
    })
  }

  removeBlockchain(chainIdentifier: string) {
    this.blockchains.delete(chainIdentifier)
  }

  public async permissionRequest(
    input: PermissionRequestV3<string>
  ): Promise<PermissionResponseV3<string>> {
    logger.log('permissionRequest', input)
    const blockchain = this.blockchains.get(input.blockchainIdentifier)
    if (!blockchain) {
      throw new Error(`Blockchain "${input.blockchainIdentifier}" not supported by dAppClient`)
    }

    // TODO: add app switching support
    // needs to be discussed with Acurast lite team
    if (input.displayQRCode && isMobileOS(window)) {
      throw new Error(
        '[BEACON] permissionRequest with "displayQRCode" set to true does not work on mobile.'
      )
    }

    const request: PermissionRequestV3<string> = {
      ...input,
      type: BeaconMessageType.PermissionRequest,
      blockchainData: {
        ...input.blockchainData,
        appMetadata: await this.getOwnAppMetadata()
      }
    }

    logger.log('REQUESTION PERMIMISSION V3', 'xxx', request)

    this.sendMetrics('performance-metrics/save', await this.buildPayload('connect', 'start'))

    const logId = `makeRequestV3 ${Date.now()}`
    logger.time(true, logId)
    const { message: response, connectionInfo } = await this.makeRequestV3<
      PermissionRequestV3<string>,
      BeaconMessageWrapper<PermissionResponseV3<string>>
    >(request).catch(async (requestError: ErrorResponse) => {
      requestError.errorType === BeaconErrorType.ABORTED_ERROR
        ? this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'abort'))
        : this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'error'))
      logger.time(false, logId)
      throw await this.handleRequestError(request as any, requestError)
    })
    logger.time(false, logId)

    this.sendMetrics('performance-metrics/save', await this.buildPayload('connect', 'start'))

    logger.log('RESPONSE V3', response, connectionInfo)

    const partialAccountInfos = await blockchain.getAccountInfosFromPermissionResponse(
      response.message
    )

    const accountInfo: any = {
      accountIdentifier: partialAccountInfos[0].accountId,
      senderId: response.senderId,
      origin: {
        type: connectionInfo.origin,
        id: connectionInfo.id
      },
      address: partialAccountInfos[0].address, // Store all addresses
      publicKey: partialAccountInfos[0].publicKey,
      scopes: response.message.blockchainData.scopes as any,
      connectedAt: new Date().getTime(),
      chainData: response.message.blockchainData
    }

    await this.accountManager.addAccount(accountInfo)
    await this.setActiveAccount(accountInfo)

    await blockchain.handleResponse({
      request,
      account: accountInfo,
      output: response,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    await this.notifySuccess(request as any, {
      account: accountInfo,
      output: {
        address: partialAccountInfos[0].address,
        network: { type: 'substrate' },
        scopes: []
      } as any,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    // return output
    return response.message
  }

  public async request(input: BlockchainRequestV3<string>): Promise<BlockchainResponseV3<string>> {
    logger.log('request', input)
    const blockchain = this.blockchains.get(input.blockchainIdentifier)
    if (!blockchain) {
      throw new Error(`Blockchain "${blockchain}" not supported by dAppClient`)
    }

    await blockchain.validateRequest(input)

    const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
    if (!activeAccount) {
      throw await this.sendInternalError('No active account!')
    }

    const request: BlockchainRequestV3<string> = {
      ...input,
      type: BeaconMessageType.BlockchainRequest,
      accountId: activeAccount.accountIdentifier
    }

    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'start'))

    const logId = `makeRequestV3 ${Date.now()}`
    logger.time(true, logId)
    const res = (await this.checkMakeRequest())
      ? this.makeRequestV3<
          BlockchainRequestV3<string>,
          BeaconMessageWrapper<BlockchainResponseV3<string>>
        >(request)
      : this.makeRequestBC<any, any>(request)

    res.catch(async (requestError: ErrorResponse) => {
      requestError.errorType === BeaconErrorType.ABORTED_ERROR
        ? this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'abort'))
        : this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'error'))
      logger.time(false, logId)
      throw await this.handleRequestError(request as any, requestError)
    })

    const { message: response, connectionInfo } = (await res)!

    logger.time(false, logId)
    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'success'))

    await blockchain.handleResponse({
      request,
      account: activeAccount,
      output: response,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    await this.notifySuccess(
      request as any,
      {
        walletInfo: await this.getWalletInfo()
      } as any
    )

    return response.message
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
    if ((input as any)?.network) {
      throw new Error(
        '[BEACON] the "network" property is no longer accepted in input. Please provide it when instantiating DAppClient.'
      )
    }

    const request: PermissionRequestInput = {
      appMetadata: await this.getOwnAppMetadata(),
      type: BeaconMessageType.PermissionRequest,
      network: this.network,
      scopes:
        input && input.scopes
          ? input.scopes
          : [PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN]
    }

    this.analytics.track('event', 'DAppClient', 'Permission requested')

    this.sendMetrics('performance-metrics/save', await this.buildPayload('connect', 'start'))

    const logId = `makeRequest ${Date.now()}`
    logger.time(true, logId)

    const res =
      (await this.checkMakeRequest()) || !(await this.getActiveAccount())
        ? this.makeRequest<PermissionRequest, PermissionResponse>(request, undefined, undefined)
        : this.makeRequestBC<PermissionRequest, PermissionResponse>(request)

    res.catch(async (requestError: ErrorResponse) => {
      requestError.errorType === BeaconErrorType.ABORTED_ERROR
        ? this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'abort'))
        : this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'error'))
      logger.time(false, logId)
      throw await this.handleRequestError(request, requestError)
    })

    const { message, connectionInfo } = (await res)!
    logger.time(false, logId)
    this.sendMetrics('performance-metrics/save', await this.buildPayload('connect', 'success'))

    logger.log('requestPermissions', '######## MESSAGE #######')
    logger.log('requestPermissions', message)

    const accountInfo = await this.onNewAccount(message, connectionInfo)

    logger.log('requestPermissions', '######## ACCOUNT INFO #######')
    logger.log('requestPermissions', JSON.stringify(accountInfo))

    await this.accountManager.addAccount(accountInfo)

    const output: PermissionResponseOutput = {
      ...message,
      walletKey: accountInfo.walletKey,
      address: accountInfo.address,
      accountInfo
    }

    await this.notifySuccess(request, {
      account: accountInfo,
      output,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    this.analytics.track('event', 'DAppClient', 'Permission received', {
      address: accountInfo.address
    })

    return output
  }

  /**
   * Send a proof of event request to the wallet. The wallet will either accept or decline the challenge.
   * If it is accepted, the challenge will be stored, meaning that even if the user refresh the page, the DAppClient will keep checking if the challenge has been fulfilled.
   * Once the challenge is stored, a challenge stored message will be sent to the wallet.
   * It's **highly recommended** to run a proof of event challenge to check the identity of an abstracted account
   *
   * @param input The message details we need to prepare the ProofOfEventChallenge message.
   */
  public async requestProofOfEventChallenge(input: RequestProofOfEventChallengeInput) {
    const activeAccount = await this.getActiveAccount()

    if (!activeAccount)
      throw new Error('Please request permissions before doing a proof of event challenge')
    if (
      activeAccount.walletType !== 'abstracted_account' &&
      activeAccount.verificationType !== 'proof_of_event'
    )
      throw new Error(
        'This wallet is not an abstracted account and thus cannot perform proof of event'
      )

    const request: ProofOfEventChallengeRequestInput = {
      type: BeaconMessageType.ProofOfEventChallengeRequest,
      contractAddress: activeAccount.address,
      payload: input.payload
    }

    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'start'))
    const logId = `makeRequest ${Date.now()}`
    logger.time(true, logId)
    const res = (await this.checkMakeRequest())
      ? this.makeRequest<ProofOfEventChallengeRequest, ProofOfEventChallengeResponse>(request)
      : this.makeRequestBC<ProofOfEventChallengeRequest, ProofOfEventChallengeResponse>(request)

    res.catch(async (requestError: ErrorResponse) => {
      requestError.errorType === BeaconErrorType.ABORTED_ERROR
        ? this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'abort'))
        : this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'error'))
      logger.time(false, logId)
      throw await this.handleRequestError(request, requestError)
    })

    const { message, connectionInfo } = (await res)!

    logger.time(false, logId)
    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'success'))

    this.analytics.track(
      'event',
      'DAppClient',
      `Proof of event challenge ${message.isAccepted ? 'accepted' : 'refused'}`,
      { address: activeAccount.address }
    )

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
   * Send a simulated proof of event request to the wallet. The wallet will either accept or decline the challenge.
   * It's the same than `requestProofOfEventChallenge` but rather than executing operations on the blockchain to prove the identity,
   * The wallet will return a list of operations that you'll be able to run on your side to verify the identity of the abstracted account
   * It's **highly recommended** to run a proof of event challenge to check the identity of an abstracted account
   *
   * @param input The message details we need to prepare the SimulatedProofOfEventChallenge message.
   */
  public async requestSimulatedProofOfEventChallenge(
    input: RequestSimulatedProofOfEventChallengeInput
  ) {
    const activeAccount = await this.getActiveAccount()

    if (!activeAccount)
      throw new Error('Please request permissions before doing a proof of event challenge')
    if (
      activeAccount.walletType !== 'abstracted_account' &&
      activeAccount.verificationType !== 'proof_of_event'
    ) {
      throw new Error(
        'This wallet is not an abstracted account and thus cannot perform a simulated proof of event'
      )
    }

    const request: SimulatedProofOfEventChallengeRequestInput = {
      type: BeaconMessageType.SimulatedProofOfEventChallengeRequest,
      contractAddress: activeAccount.address,
      ...input
    }
    const logId = `makeRequest ${Date.now()}`
    logger.time(true, logId)

    const res = (await this.checkMakeRequest())
      ? this.makeRequest<
          SimulatedProofOfEventChallengeRequest,
          SimulatedProofOfEventChallengeResponse
        >(request)
      : this.makeRequestBC<
          SimulatedProofOfEventChallengeRequest,
          SimulatedProofOfEventChallengeResponse
        >(request)

    res.catch(async (requestError: ErrorResponse) => {
      requestError.errorType === BeaconErrorType.ABORTED_ERROR
        ? this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'abort'))
        : this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'error'))
      logger.time(false, logId)
      throw await this.handleRequestError(request, requestError)
    })

    const { message, connectionInfo } = (await res)!

    logger.time(false, logId)
    this.analytics.track(
      'event',
      'DAppClient',
      `Simulated proof of event challenge ${!message.errorMessage ? 'accepted' : 'refused'}`,
      { address: activeAccount.address }
    )

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
          if (!payload.startsWith('03')) {
            throw new Error(
              'When using signing type "OPERATION", the payload must start with prefix "03"'
            )
          }

          return SigningType.OPERATION

        case SigningType.MICHELINE:
          if (!payload.startsWith('05')) {
            throw new Error(
              'When using signing type "MICHELINE", the payload must start with prefix "05"'
            )
          }

          return SigningType.MICHELINE

        case SigningType.RAW:
        default:
          return SigningType.RAW
      }
    })()

    this.analytics.track('event', 'DAppClient', 'Signature requested')

    const request: SignPayloadRequestInput = {
      type: BeaconMessageType.SignPayloadRequest,
      signingType,
      payload,
      sourceAddress: input.sourceAddress || activeAccount.address
    }

    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'start'))
    const logId = `makeRequest ${Date.now()}`
    logger.time(true, logId)
    const res = (await this.checkMakeRequest())
      ? this.makeRequest<SignPayloadRequest, SignPayloadResponse>(request)
      : this.makeRequestBC<SignPayloadRequest, SignPayloadResponse>(request)

    res.catch(async (requestError: ErrorResponse) => {
      requestError.errorType === BeaconErrorType.ABORTED_ERROR
        ? this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'abort'))
        : this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'error'))
      logger.time(false, logId)
      throw await this.handleRequestError(request, requestError)
    })

    const { message, connectionInfo } = (await res)!

    logger.time(false, logId)
    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'success'))

    await this.notifySuccess(request, {
      account: activeAccount,
      output: message,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    this.analytics.track('event', 'DAppClient', 'Signature response')

    return message
  }

  /**
   * This method will send an "EncryptPayloadRequest" to the wallet. This method is meant to be used to encrypt or decrypt
   * arbitrary data (eg. a string). It will return the encrypted or decrypted payload
   *
   * @param input The message details we need to prepare the EncryptPayloadRequest message.
   */
  // TODO: ENCRYPTION
  // public async requestEncryptPayload(
  //   input: RequestEncryptPayloadInput
  // ): Promise<EncryptPayloadResponseOutput> {
  //   if (!input.payload) {
  //     throw await this.sendInternalError('Payload must be provided')
  //   }
  //   const activeAccount: AccountInfo | undefined = await this.getActiveAccount()
  //   if (!activeAccount) {
  //     throw await this.sendInternalError('No active account!')
  //   }

  //   const payload = input.payload

  //   if (typeof payload !== 'string') {
  //     throw new Error('Payload must be a string')
  //   }

  //   if (typeof input.encryptionCryptoOperation === 'undefined') {
  //     throw new Error('encryptionCryptoOperation must be defined')
  //   }

  //   if (typeof input.encryptionType === 'undefined') {
  //     throw new Error('encryptionType must be defined')
  //   }

  //   const request: EncryptPayloadRequestInput = {
  //     type: BeaconMessageType.EncryptPayloadRequest,
  //     cryptoOperation: input.encryptionCryptoOperation,
  //     encryptionType: input.encryptionType,
  //     payload,
  //     sourceAddress: input.sourceAddress || activeAccount.address
  //   }

  //   const { message, connectionInfo } = await this.makeRequest<
  //     EncryptPayloadRequest,
  //     EncryptPayloadResponse
  //   >(request).catch(async (requestError: ErrorResponse) => {
  //     throw await this.handleRequestError(request, requestError)
  //   })

  //   await this.notifySuccess(request, {
  //     account: activeAccount,
  //     output: message,
  //     connectionContext: connectionInfo,
  //     walletInfo: await this.getWalletInfo()
  //   })

  //   return message
  // }

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
      network: activeAccount.network || this.network,
      operationDetails: input.operationDetails,
      sourceAddress: activeAccount.address || ''
    }

    this.analytics.track('event', 'DAppClient', 'Operation requested')

    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'start'))
    const logId = `makeRequest ${Date.now()}`
    logger.time(true, logId)

    const res = (await this.checkMakeRequest())
      ? this.makeRequest<OperationRequest, OperationResponse>(request)
      : this.makeRequestBC<OperationRequest, OperationResponse>(request)

    res.catch(async (requestError: ErrorResponse) => {
      requestError.errorType === BeaconErrorType.ABORTED_ERROR
        ? this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'abort'))
        : this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'error'))
      logger.time(false, logId)
      throw await this.handleRequestError(request, requestError)
    })

    const { message, connectionInfo } = (await res)!

    logger.time(false, logId)
    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'success'))

    await this.notifySuccess(request, {
      account: activeAccount,
      output: message,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    this.analytics.track('event', 'DAppClient', 'Operation response')

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

    // Add error message for deprecation of network
    // TODO: Remove when we remove deprecated preferredNetwork
    if (input.network !== undefined && this.network.type !== input.network?.type) {
      console.error(
        '[BEACON] The network specified in the DAppClient constructor does not match the network set in the broadcast request. Please set the network in the constructor. Setting it during the Broadcast Request is deprecated.'
      )
    }

    const request: BroadcastRequestInput = {
      type: BeaconMessageType.BroadcastRequest,
      network: this.network,
      signedTransaction: input.signedTransaction
    }

    this.analytics.track('event', 'DAppClient', 'Broadcast requested')

    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'start'))
    const logId = `makeRequest ${Date.now()}`
    logger.time(true, logId)
    const res = (await this.checkMakeRequest())
      ? this.makeRequest<BroadcastRequest, BroadcastResponse>(request)
      : this.makeRequestBC<BroadcastRequest, BroadcastResponse>(request)

    res.catch(async (requestError: ErrorResponse) => {
      requestError.errorType === BeaconErrorType.ABORTED_ERROR
        ? this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'abort'))
        : this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'error'))
      logger.time(false, logId)
      throw await this.handleRequestError(request, requestError)
    })

    const { message, connectionInfo } = (await res)!

    logger.time(false, logId)
    this.sendMetrics('performance-metrics/save', await this.buildPayload('message', 'success'))

    await this.notifySuccess(request, {
      network: this.network,
      output: message,
      blockExplorer: this.blockExplorer,
      connectionContext: connectionInfo,
      walletInfo: await this.getWalletInfo()
    })

    this.analytics.track('event', 'DAppClient', 'Broadcast response')

    return message
  }

  protected async setActivePeer(peer?: PeerInfoType): Promise<void> {
    if (this._activePeer.isSettled()) {
      // If the promise has already been resolved we need to create a new one.
      this._activePeer = ExposedPromise.resolve(peer)
    } else {
      this._activePeer.resolve(peer)
    }

    if (!peer) {
      return
    }

    await this.initInternalTransports()

    if (peer.type === 'postmessage-pairing-response') {
      await this.setTransport(this.postMessageTransport)
    } else if (peer.type === 'p2p-pairing-response') {
      await this.setTransport(this.p2pTransport)
    }
  }

  /**
   * A "setter" for when the transport needs to be changed.
   */
  protected async setTransport(transport?: Transport<any>): Promise<void> {
    if (!transport) {
      this._initPromise = undefined
    }

    const result = super.setTransport(transport)

    const event = transport ? { ...(transport as any) } : undefined

    // remove keyPair, to prevent dApps from accidentaly leaking the privateKey
    if (event) {
      event.client = {
        ...event.client,
        keyPair: undefined
      }
    }

    await this.events.emit(BeaconEvent.ACTIVE_TRANSPORT_SET, event)

    return result
  }

  /**
   * This method will emit an internal error message.
   *
   * @param errorMessage The error message to send.
   */
  private async sendInternalError(errorMessage: string): Promise<void> {
    await this.events.emit(BeaconEvent.INTERNAL_ERROR, { text: errorMessage })
    throw new Error(errorMessage)
  }

  /**
   * This method will remove all accounts associated with a specific peer.
   *
   * @param peersToRemove An array of peers for which accounts should be removed
   */
  private async removeAccountsForPeers(peersToRemove: ExtendedPeerInfo[]): Promise<void> {
    const peerIdsToRemove = peersToRemove.map((peer) => peer.senderId)

    return this.removeAccountsForPeerIds(peerIdsToRemove)
  }

  private async removeAccountsForPeerIds(peerIds: string[]): Promise<void> {
    const accounts = await this.accountManager.getAccounts()

    // Remove all accounts with origin of the specified peer
    const accountsToRemove = accounts.filter((account) => peerIds.includes(account.senderId))
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

      // If we sent a permission request, received an error and there is no active account, we need to reset the DAppClient.
      // This most likely means that the user rejected the first permission request after pairing a wallet, so we "forget" the paired wallet to allow the user to pair again.
      if (
        request.type === BeaconMessageType.PermissionRequest &&
        (await this.getActiveAccount()) === undefined
      ) {
        this._initPromise = undefined
        this.postMessageTransport = undefined
        this.p2pTransport = undefined
        this.walletConnectTransport = undefined
        await this.setTransport()
        await this.setActivePeer()
      }

      this.events
        .emit(
          messageEvents[request.type].error,
          {
            errorResponse: beaconError,
            walletInfo: await this.getWalletInfo(peer, activeAccount),
            errorMessages: this.errorMessages
          },
          buttons
        )
        .catch((emitError) => logger.error('handleRequestError', emitError))

      throw getError(beaconError.errorType, beaconError.errorData)
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
          output: ProofOfEventChallengeResponse
          blockExplorer: BlockExplorer
          connectionContext: ConnectionContext
          walletInfo: WalletInfo
        }
      | {
          account: AccountInfo
          output: SimulatedProofOfEventChallengeResponse
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
      // | {
      //     output: EncryptPayloadResponseOutput
      //     connectionContext: ConnectionContext
      //     walletInfo: WalletInfo
      // }
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

  private async getWalletInfoFromStorage() {
    return await this.storage.get(StorageKey.LAST_SELECTED_WALLET)
  }

  private async updateStorageWallet(walletInfo: WalletInfo) {
    const wallet = await this.storage.get(StorageKey.LAST_SELECTED_WALLET)

    if (!wallet) {
      return
    }

    wallet.name = walletInfo.name
    wallet.icon = walletInfo.icon ?? wallet.icon
    this.storage.set(StorageKey.LAST_SELECTED_WALLET, wallet)
  }

  private async getWalletInfo(
    peer?: PeerInfo,
    account?: AccountInfo,
    readFromStorage: boolean = true
  ): Promise<WalletInfo> {
    const selectedAccount = account ? account : await this.getActiveAccount()

    const selectedPeer = peer ? peer : await this.getPeer(selectedAccount)

    let walletInfo: WalletInfo | undefined
    if (selectedAccount) {
      walletInfo = await this.appMetadataManager.getAppMetadata(selectedAccount.senderId)
    }

    let storageWallet

    if (readFromStorage) {
      storageWallet = await this.getWalletInfoFromStorage()
    }

    if (!walletInfo) {
      walletInfo = {
        name: selectedPeer?.name ?? storageWallet?.key ?? '',
        icon: selectedPeer?.icon ?? storageWallet?.icon,
        type: storageWallet?.type
      }

      this.updateStorageWallet(walletInfo)
    }

    const lowerCaseCompare = (str1?: string, str2?: string): boolean => {
      if (str1 && str2) {
        return str1.toLowerCase() === str2.toLowerCase()
      }

      return false
    }

    const getOrgName = (name: string) => name.split(/[_\s]+/)[0]

    const apps: AppBase[] = [
      ...getiOSList(),
      ...getWebList(),
      ...getDesktopList(),
      ...getExtensionList()
    ].filter((app: AppBase) =>
      lowerCaseCompare(getOrgName(app.key), getOrgName(walletInfo?.name ?? 'wallet'))
    )

    // TODO: Remove once all wallets send the icon?
    const mobile = (apps as App[]).find(
      (app) => app.universalLink || app.key.includes('ios') || app.key.includes('mobile')
    )
    const browser = (apps as WebApp[]).find((app) => app.links)
    const desktop = (apps as DesktopApp[]).find((app) => app.downloadLink)
    const extension = (apps as ExtensionApp[]).find((app) => app.id)

    const appTypeMap = {
      extension: { app: extension, type: 'extension' },
      desktop: { app: desktop, type: 'desktop' },
      mobile: { app: mobile, type: 'mobile' },
      web: { app: browser, type: 'web' }
    }

    const defaultType = (): {
      app: AppBase | undefined
      type: 'extension' | 'mobile' | 'web' | 'desktop' | undefined
    } => {
      if (isBrowser(window) && browser) return { app: browser, type: 'web' }
      if (isDesktop(window) && desktop) return { app: desktop, type: 'desktop' }
      if (isBrowser(window) && extension) return { app: extension, type: 'extension' }
      if (mobile) return { app: mobile, type: 'mobile' }
      return { app: undefined, type: undefined }
    }

    const { app, type } = storageWallet ? appTypeMap[storageWallet.type] : defaultType()

    if (app) {
      let deeplink: string | undefined
      if (app.hasOwnProperty('links')) {
        deeplink = (app as WebApp).links[selectedAccount?.network.type ?? this.network.type]
      } else if (app.hasOwnProperty('deepLink')) {
        deeplink = (app as App).deepLink
      }

      return {
        name: app?.name ?? walletInfo.name,
        icon: app?.logo ?? walletInfo.icon,
        deeplink,
        type: type as any
      }
    }

    return walletInfo
  }

  private async getPeer(account?: AccountInfo): Promise<PeerInfo | undefined> {
    let peer: PeerInfo | undefined

    if (account) {
      logger.log('getPeer', 'We have an account', account)
      const postMessagePeers: ExtendedPostMessagePairingResponse[] =
        (await this.postMessageTransport?.getPeers()) ?? []
      const p2pPeers: ExtendedP2PPairingResponse[] = (await this.p2pTransport?.getPeers()) ?? []
      const walletConnectPeers: ExtendedWalletConnectPairingResponse[] =
        (await this.walletConnectTransport?.getPeers()) ?? []
      const peers = [...postMessagePeers, ...p2pPeers, ...walletConnectPeers]

      logger.log('getPeer', 'Found peers', peers, account)

      peer = peers.find((peerEl) => peerEl.senderId === account.senderId)
      if (!peer) {
        // We could not find an exact match for a sender, so we most likely received it over a relay
        peer = peers.find((peerEl) => (peerEl as any).extensionId === account.origin.id)
      }
    } else {
      peer = await this._activePeer.promise
      logger.log('getPeer', 'Active peer', peer)
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
   * @param skipResponse If true, the function return as soon as the message is sent
   */

  private makeRequest<T extends BeaconRequestInputMessage, U extends BeaconMessage>(
    requestInput: Optional<T, IgnoredRequestInputProperties>,
    skipResponse?: undefined | false,
    otherTabMessageId?: string
  ): Promise<{
    message: U
    connectionInfo: ConnectionContext
  }>
  private makeRequest<T extends BeaconRequestInputMessage, U extends BeaconMessage>(
    requestInput: Optional<T, IgnoredRequestInputProperties>,
    skipResponse: true,
    otherTabMessageId?: string
  ): Promise<undefined>
  private async makeRequest<T extends BeaconRequestInputMessage, U extends BeaconMessage>(
    requestInput: Optional<T, IgnoredRequestInputProperties>,
    skipResponse?: boolean,
    otherTabMessageId?: string
  ) {
    const messageId = otherTabMessageId ?? (await generateGUID())

    if (this._initPromise && this.isInitPending) {
      await Promise.all([
        this.postMessageTransport?.disconnect(),
        this.walletConnectTransport?.disconnect()
      ])
      this._initPromise = undefined
      this.hideUI(['toast'])
    }

    logger.log('makeRequest', 'starting')
    this.isInitPending = true
    await this.init()
    this.isInitPending = false
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

    const request: Optional<T, IgnoredRequestInputProperties> &
      Pick<U, IgnoredRequestInputProperties> = {
      id: messageId,
      version: '2', // This is the old version
      senderId: await getSenderId(await this.beaconId),
      ...requestInput
    }

    let exposed

    if (!skipResponse) {
      exposed = new ExposedPromise<
        {
          message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
          connectionInfo: ConnectionContext
        },
        ErrorResponse
      >()

      this.addOpenRequest(request.id, exposed)
    }

    const payload = await new Serializer().serialize(request)

    const account = await this.getActiveAccount()

    const peer = await this.getPeer(account)

    const walletInfo = await this.getWalletInfo(peer, account)

    logger.log('makeRequest', 'sending message', request)
    try {
      ;(await this.transport).send(payload, peer)
      if (
        request.type !== BeaconMessageType.PermissionRequest ||
        (this._activeAccount.isResolved() && (await this._activeAccount.promise))
      ) {
        this.tryToAppSwitch()
      }
    } catch (sendError) {
      this.events.emit(BeaconEvent.INTERNAL_ERROR, {
        text: 'Unable to send message. If this problem persists, please reset the connection and pair your wallet again.',
        buttons: [
          {
            text: 'Reset Connection',
            actionCallback: async () => {
              closeToast()
              this.disconnect()
            }
          }
        ]
      })
      throw sendError
    }

    if (!otherTabMessageId) {
      this.events
        .emit(messageEvents[requestInput.type].sent, {
          walletInfo: {
            ...walletInfo,
            name: walletInfo.name ?? 'Wallet'
          },
          extraInfo: {
            resetCallback: async () => {
              this.disconnect()
            }
          }
        })
        .catch((emitError) => console.warn(emitError))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return exposed?.promise as any // TODO: fix type
  }

  /**
   * This method handles sending of requests to the DApp. It makes sure that the DAppClient is initialized and connected
   * to the transport. After that rate limits and permissions will be checked, an ID is attached and the request is sent
   * to the DApp over the transport.
   *
   * @param requestInput The BeaconMessage to be sent to the wallet
   * @param account The account that the message will be sent to
   */
  private async makeRequestV3<
    T extends BlockchainMessage<string>,
    U extends BeaconMessageWrapper<BlockchainMessage<string>>
  >(
    requestInput: T,
    otherTabMessageId?: string
  ): Promise<{
    message: U
    connectionInfo: ConnectionContext
  }> {
    if (this._initPromise && this.isInitPending) {
      await Promise.all([
        this.postMessageTransport?.disconnect(),
        this.walletConnectTransport?.disconnect()
      ])
      this._initPromise = undefined
      this.hideUI(['toast'])
    }

    const messageId = otherTabMessageId ?? (await generateGUID())
    logger.log('makeRequest', 'starting')
    this.isInitPending = true
    await this.init(undefined, (requestInput as any).displayQRCode)
    this.isInitPending = false
    logger.log('makeRequest', 'after init')

    if (await this.addRequestAndCheckIfRateLimited()) {
      this.events
        .emit(BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch((emitError) => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    if (!this.beaconId) {
      throw await this.sendInternalError('BeaconID not defined')
    }

    const request: BeaconMessageWrapper<BlockchainMessage> = {
      id: messageId,
      version: '3',
      senderId: await getSenderId(await this.beaconId),
      message: requestInput
    }

    const exposed = new ExposedPromise<
      {
        message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
        connectionInfo: ConnectionContext
      },
      ErrorResponse
    >()

    this.addOpenRequest(request.id, exposed)

    const payload = await new Serializer().serialize(request)

    const account = await this.getActiveAccount()

    const peer = await this.getPeer(account)

    const walletInfo = await this.getWalletInfo(peer, account)

    logger.log('makeRequest', 'sending message', request)
    try {
      ;(await this.transport).send(payload, peer)
      if (
        request.message.type !== BeaconMessageType.PermissionRequest ||
        (this._activeAccount.isResolved() && (await this._activeAccount.promise))
      ) {
        this.tryToAppSwitch()
      }
    } catch (sendError) {
      this.events.emit(BeaconEvent.INTERNAL_ERROR, {
        text: 'Unable to send message. If this problem persists, please reset the connection and pair your wallet again.',
        buttons: [
          {
            text: 'Reset Connection',
            actionCallback: async () => {
              closeToast()
              this.disconnect()
            }
          }
        ]
      })
      throw sendError
    }

    const index = requestInput.type as any as BeaconMessageType

    this.events
      .emit(messageEvents[index].sent, {
        walletInfo: {
          ...walletInfo,
          name: walletInfo.name ?? 'Wallet'
        },
        extraInfo: {
          resetCallback: async () => {
            this.disconnect()
          }
        }
      })
      .catch((emitError) => console.warn(emitError))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return exposed.promise as any // TODO: fix type
  }

  private async makeRequestBC<T extends BeaconRequestInputMessage, U extends BeaconMessage>(
    request: Optional<T, IgnoredRequestInputProperties>
  ): Promise<
    | {
        message: U
        connectionInfo: ConnectionContext
      }
    | undefined
  > {
    if (!this._transport.isResolved()) {
      return
    }

    const transport = await this.transport

    if (transport.type !== TransportType.WALLETCONNECT) {
      return
    }

    if (await this.addRequestAndCheckIfRateLimited()) {
      this.events
        .emit(BeaconEvent.LOCAL_RATE_LIMIT_REACHED)
        .catch((emitError) => console.warn(emitError))

      throw new Error('rate limit reached')
    }

    const id = await generateGUID()

    this.multiTabChannel.postMessage({
      type: request.type,
      data: request,
      id
    })

    if (
      request.type !== BeaconMessageType.PermissionRequest ||
      (this._activeAccount.isResolved() && (await this._activeAccount.promise))
    ) {
      this.tryToAppSwitch()
    }

    this.events
      .emit(messageEvents[BeaconMessageType.PermissionRequest].sent, {
        walletInfo: await this.getWalletInfo(),
        extraInfo: {
          resetCallback: () => this.disconnect()
        }
      })
      .catch((emitError) => console.warn(emitError))

    const exposed = new ExposedPromise<
      {
        message: U
        connectionInfo: ConnectionContext
      },
      ErrorResponse
    >()

    this.addOpenRequest(id, exposed as any)

    return exposed.promise
  }

  public async disconnect() {
    if (!this._transport.isResolved()) {
      throw new Error('No transport available.')
    }

    const transport = await this.transport

    if (transport.connectionStatus === TransportStatus.NOT_CONNECTED) {
      throw new Error('Not connected.')
    }

    await this.createStateSnapshot()
    this.sendMetrics('performance-metrics/save', await this.buildPayload('disconnect', 'start'))
    await this.clearActiveAccount()
    if (!(transport instanceof WalletConnectTransport)) {
      await transport.disconnect()
    }
    this.postMessageTransport = undefined
    this.p2pTransport = undefined
    this.walletConnectTransport = undefined
    this.sendMetrics('performance-metrics/save', await this.buildPayload('disconnect', 'success'))
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
      {
        message: BeaconMessage | BeaconMessageWrapper<BeaconBaseMessage>
        connectionInfo: ConnectionContext
      },
      ErrorResponse
    >
  ): void {
    logger.log('addOpenRequest', this.name, `adding request ${id} and waiting for answer`)
    this.openRequests.set(id, promise)
  }

  private async sendNotificationWithAccessToken(notification: {
    url: string
    recipient: string
    title: string
    body: string
    payload: string
    protocolIdentifier: string
    accessToken: string
  }): Promise<string> {
    const { url, recipient, title, body, payload, protocolIdentifier, accessToken } = notification
    const timestamp = new Date().toISOString()

    const keypair = await this.keyPair

    const rawPublicKey = keypair.publicKey

    const prefix = Buffer.from(new Uint8Array([13, 15, 37, 217]))

    const publicKey = bs58check.encode(Buffer.concat([prefix, Buffer.from(rawPublicKey)]))

    const constructedString = [
      'Tezos Signed Message: ',
      recipient,
      title,
      body,
      timestamp,
      payload
    ].join(' ')

    const bytes = toHex(constructedString)
    const payloadBytes = '05' + '01' + bytes.length.toString(16).padStart(8, '0') + bytes

    const signature = await signMessage(payloadBytes, {
      secretKey: Buffer.from(keypair.secretKey)
    })

    const notificationResponse = await axios.post(`${url}/send`, {
      recipient,
      title,
      body,
      timestamp,
      payload,
      accessToken,
      protocolIdentifier,
      sender: {
        name: this.name,
        publicKey,
        signature
      }
    })

    return notificationResponse.data
  }

  private async onNewAccount(
    message: PermissionResponse | ChangeAccountRequest,
    connectionInfo: ConnectionContext
  ): Promise<AccountInfo> {
    // TODO: Migration code. Remove sometime after 1.0.0 release.
    const tempPK: string | undefined =
      message.publicKey || (message as any).pubkey || (message as any).pubKey

    const publicKey = !!tempPK ? prefixPublicKey(tempPK) : undefined

    if (!publicKey && !message.address) {
      throw new Error('PublicKey or Address must be defined')
    }

    const address = message.address ?? (await getAddressFromPublicKey(publicKey!))

    if (!isValidAddress(address)) {
      throw new Error(`Invalid address: "${address}"`)
    }

    if (
      message.walletType === 'abstracted_account' &&
      address.substring(0, 3) !== CONTRACT_PREFIX
    ) {
      throw new Error(
        `Invalid abstracted account address "${address}", it should be a ${CONTRACT_PREFIX} address`
      )
    }

    logger.log('######## MESSAGE #######')
    logger.log('onNewAccount', message)

    const walletKey = (await this.storage.get(StorageKey.LAST_SELECTED_WALLET))?.key

    const accountInfo: AccountInfo = {
      accountIdentifier: await getAccountIdentifier(address, message.network),
      senderId: message.senderId,
      origin: {
        type: connectionInfo.origin,
        id: connectionInfo.id
      },
      walletKey,
      address,
      publicKey,
      network: message.network,
      scopes: message.scopes,
      threshold: message.threshold,
      notification: message.notification,
      connectedAt: new Date().getTime(),
      walletType: message.walletType ?? 'implicit',
      verificationType: message.verificationType,
      ...(message.verificationType === 'proof_of_event' ? { hasVerifiedChallenge: false } : {})
    }

    logger.log('accountInfo', '######## ACCOUNT INFO #######')

    logger.log('accountInfo', accountInfo)

    await this.accountManager.addAccount(accountInfo)
    await this.setActiveAccount(accountInfo)

    return accountInfo
  }
}
