import {
  BEACON_VERSION,
  CommunicationClient,
  Serializer,
  ClientEvents,
  Logger,
  WCStorage,
  SDK_VERSION
} from '@airgap/beacon-core'
import Client from '@walletconnect/sign-client'
import { ProposalTypes, SessionTypes, SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import {
  ActiveAccountUnspecified,
  ActiveNetworkUnspecified,
  InvalidNetworkOrAccount,
  InvalidReceivedSessionNamespace,
  InvalidSession,
  MissingRequiredScope,
  NotConnected
} from '../error'
import {
  AcknowledgeResponseInput,
  BeaconBaseMessage,
  BeaconErrorType,
  BeaconMessageType,
  BeaconResponseInputMessage,
  ChangeAccountRequest,
  DisconnectMessage,
  ErrorResponse,
  ErrorResponseInput,
  ExtendedWalletConnectPairingRequest,
  ExtendedWalletConnectPairingResponse,
  IgnoredResponseInputProperties,
  Network,
  NetworkType,
  OperationRequest,
  OperationResponseInput,
  Optional,
  PermissionRequest,
  PermissionResponseInput,
  PermissionScope,
  SignPayloadRequest,
  SignPayloadResponse,
  SignPayloadResponseInput,
  StorageKey,
  TransportType
} from '@airgap/beacon-types'
import { generateGUID, getAddressFromPublicKey } from '@airgap/beacon-utils'

const TEZOS_PLACEHOLDER = 'tezos'
const logger = new Logger('WalletConnectCommunicationClient')

export interface PermissionScopeParam {
  networks: NetworkType[]
  methods: PermissionScopeMethods[]
  events?: PermissionScopeEvents[]
}
export enum PermissionScopeMethods {
  GET_ACCOUNTS = 'tezos_getAccounts',
  OPERATION_REQUEST = 'tezos_send',
  SIGN = 'tezos_sign'
}

export enum PermissionScopeEvents {
  CHAIN_CHANGED = 'chainChanged',
  ACCOUNTS_CHANGED = 'accountsChanged',
  REQUEST_ACKNOWLEDGED = 'requestAcknowledged'
}

type BeaconInputMessage =
  | BeaconResponseInputMessage
  | Optional<DisconnectMessage, IgnoredResponseInputProperties>
  | Optional<ChangeAccountRequest, IgnoredResponseInputProperties>

function getStringBetween(str: string | undefined, startChar: string, endChar: string): string {
  if (!str || !startChar || !endChar) {
    return ''
  }

  const startIndex = str.indexOf(startChar)
  const endIndex = str.indexOf(endChar, startIndex + 1)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('String not found')
  }

  return str.substring(startIndex + 1, endIndex)
}

export class WalletConnectCommunicationClient extends CommunicationClient {
  protected readonly activeListeners: Map<string, (message: string) => void> = new Map()

  protected readonly channelOpeningListeners: Map<
    string,
    (pairingResponse: ExtendedWalletConnectPairingResponse) => void
  > = new Map()

  private static instance: WalletConnectCommunicationClient
  public signClient: Client | undefined
  public storage: WCStorage = new WCStorage()
  private session: SessionTypes.Struct | undefined
  private activeAccount: string | undefined
  private activeNetwork: string | undefined
  readonly disconnectionEvents: Set<string> = new Set()
  private pingInterval: NodeJS.Timeout | undefined

  /**
   * this queue stores each active message id
   * [0] newest message
   * [length - 1] oldest message
   */
  private messageIds: string[] = []

  constructor(private wcOptions: { network: NetworkType; opts: SignClientTypes.Options }) {
    super()
    this.storage.onMessageHandler = this.onStorageMessageHandler.bind(this)
    this.storage.onErrorHandler = this.onStorageErrorHandler.bind(this)
  }

  static getInstance(wcOptions: {
    network: NetworkType
    opts: SignClientTypes.Options
  }): WalletConnectCommunicationClient {
    if (!this.instance) {
      this.instance = new WalletConnectCommunicationClient(wcOptions)
    }
    return WalletConnectCommunicationClient.instance
  }

  private getTopicFromSession(session: SessionTypes.Struct): string {
    return session.topic
  }

  public async listenForEncryptedMessage(
    senderPublicKey: string,
    messageCallback: (message: string) => void
  ): Promise<void> {
    if (this.activeListeners.has(senderPublicKey)) {
      return
    }

    const callbackFunction = async (message: string): Promise<void> => {
      messageCallback(message)
    }

    this.activeListeners.set(senderPublicKey, callbackFunction)
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: ExtendedWalletConnectPairingResponse) => void
  ): Promise<void> {
    const callbackFunction = async (
      pairingResponse: ExtendedWalletConnectPairingResponse
    ): Promise<void> => {
      messageCallback(pairingResponse)
    }
    this.channelOpeningListeners.set('channelOpening', callbackFunction)
  }

  /**
   * WC Sign client doesn't sync between intances, meaning that a dApp signClient instance state may
   * differ from a wallet state
   */
  private async refreshState() {
    await this.closeSignClient()

    const client = (await this.getSignClient())!
    const lastIndex = client.session.keys.length - 1

    if (lastIndex > -1) {
      this.session = client.session.get(client.session.keys[lastIndex])
      this.updateStorageWallet(this.session)
      this.setDefaultAccountAndNetwork()
    } else {
      this.clearState()
    }
  }

  private clearEvents() {
    this.signClient?.removeAllListeners('session_event')
    this.signClient?.removeAllListeners('session_update')
    this.signClient?.removeAllListeners('session_delete')
    this.signClient?.removeAllListeners('session_expire')
    this.signClient?.core.pairing.events.removeAllListeners('pairing_delete')
    this.signClient?.core.pairing.events.removeAllListeners('pairing_expire')
  }

  private abortErrorBuilder() {
    if (!this.messageIds.length) {
      return
    }

    const errorResponse: any = {
      type: BeaconMessageType.Disconnect,
      id: this.messageIds.pop(),
      errorType: BeaconErrorType.ABORTED_ERROR
    }
    this.session && this.notifyListeners(this.getTopicFromSession(this.session), errorResponse)
    this.messageIds = [] // reset
  }

  private onStorageMessageHandler(type: string) {
    logger.debug('onStorageMessageHandler', type)

    if (type === 'RESET') {
      this.abortErrorBuilder()
      this.clearEvents()
      // no need to invoke `closeSignClinet` as the other tab already closed the connection
      this.signClient = undefined
      this.clearState()

      return
    }

    this.refreshState()
  }

  private onStorageErrorHandler(data: any) {
    logger.error('onStorageError', data)
  }

  async unsubscribeFromEncryptedMessages(): Promise<void> {
    this.activeListeners.clear()
    this.channelOpeningListeners.clear()
  }

  async unsubscribeFromEncryptedMessage(_senderPublicKey: string): Promise<void> {
    // implementation
  }

  private async closeSignClient() {
    if (!this.signClient) {
      logger.error('No client active')
      return
    }

    await this.signClient.core.relayer.transportClose()
    this.signClient.core.events.removeAllListeners()
    this.signClient.core.relayer.events.removeAllListeners()
    this.signClient.core.heartbeat.stop()
    this.signClient.core.relayer.provider.events.removeAllListeners()
    this.signClient.core.relayer.subscriber.events.removeAllListeners()
    this.signClient.core.relayer.provider.connection.events.removeAllListeners()
    this.clearEvents()

    this.signClient = undefined
  }

  private async ping() {
    const client = await this.getSignClient()

    if (!client || !this.session) {
      logger.error('No session available.')
      return
    }

    client
      .ping({ topic: this.session.topic })
      .then(() => {
        if (this.messageIds.length) {
          this.acknowledgeRequest(this.messageIds[0])
        }
      })
      .catch((error) => {
        logger.error(`ping catch handler: ${error.message}`)
      })
      .then(() => {
        clearInterval(this.pingInterval)
        this.pingInterval = undefined
      })
  }

  private async checkWalletReadiness(_topic: string) {
    if (this.pingInterval) {
      return
    }

    this.ping()
    this.pingInterval = setInterval(() => {
      this.ping()
    }, 30000)
  }

  async sendMessage(_message: string, _peer?: any): Promise<void> {
    const serializer = new Serializer()
    const message = (await serializer.deserialize(_message)) as any

    if (!message) {
      return
    }

    this.messageIds.unshift(message.id)

    switch (message.type) {
      case BeaconMessageType.PermissionRequest:
        this.requestPermissions(message)
        break
      case BeaconMessageType.OperationRequest:
        this.sendOperations(message)
        break
      case BeaconMessageType.SignPayloadRequest:
        this.signPayload(message)
        break
      default:
        return
    }
  }

  private async fetchAccounts(topic: string, chainId: string) {
    const signClient = await this.getSignClient()
    if (!signClient) {
      return
    }
    return signClient.request<
      [
        {
          algo: 'ed25519'
          address: string
          pubkey: string
        }
      ]
    >({
      topic: topic,
      chainId: chainId,
      request: {
        method: PermissionScopeMethods.GET_ACCOUNTS,
        params: {}
      }
    })
  }

  private async notifyListenersWithPermissionResponse(
    session: SessionTypes.Struct,
    network: Network,
    sessionEventId?: string
  ) {
    let publicKey: string | undefined
    if (
      session.sessionProperties?.pubkey &&
      session.sessionProperties?.algo &&
      session.sessionProperties?.address
    ) {
      publicKey = session.sessionProperties?.pubkey
      logger.log(
        '[requestPermissions]: Have pubkey in sessionProperties, skipping "get_accounts" call',
        session.sessionProperties
      )
    } else {
      const accounts = this.getTezosNamespace(session.namespaces).accounts
      const addressOrPbk = accounts[0].split(':', 3)[2]

      if (addressOrPbk.startsWith('edpk')) {
        publicKey = addressOrPbk
      } else {
        if (network.type !== this.wcOptions.network) {
          throw new Error('Network in permission request is not the same as preferred network!')
        }

        const result = await this.fetchAccounts(
          session.topic,
          `${TEZOS_PLACEHOLDER}:${network.type}`
        )

        if (!result || result.length < 1) {
          throw new Error('No account shared by wallet')
        }

        if (result.some((account) => !account.pubkey)) {
          throw new Error('Public Key in `tezos_getAccounts` is empty!')
        }

        publicKey = result[0]?.pubkey
      }
    }

    if (!publicKey) {
      throw new Error('Public Key in `tezos_getAccounts` is empty!')
    }

    const permissionResponse: PermissionResponseInput = {
      type: BeaconMessageType.PermissionResponse,
      appMetadata: {
        senderId: this.getTopicFromSession(session),
        name: session.peer.metadata.name,
        icon: session.peer.metadata.icons[0]
      },
      publicKey,
      network,
      scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST],
      id: sessionEventId ?? this.messageIds.pop() ?? '',
      walletType: 'implicit'
    }

    this.notifyListeners(this.getTopicFromSession(session), permissionResponse)
  }

  async requestPermissions(message: PermissionRequest) {
    logger.log('#### Requesting permissions')

    if (!this.getPermittedMethods().includes(PermissionScopeMethods.GET_ACCOUNTS)) {
      throw new MissingRequiredScope(PermissionScopeMethods.GET_ACCOUNTS)
    }

    if (this.activeAccount) {
      try {
        await this.openSession()
      } catch (error: any) {
        logger.error(error.message)
        return
      }
    }

    this.setDefaultAccountAndNetwork()
    this.notifyListenersWithPermissionResponse(this.getSession(), message.network)
  }

  /**
   * @description Once the session is establish, send payload to be approved and signed by the wallet.
   * @error MissingRequiredScope is thrown if permission to sign payload was not granted
   */
  async signPayload(signPayloadRequest: SignPayloadRequest) {
    const signClient = await this.getSignClient()

    if (!signClient) {
      return
    }

    const session = this.getSession()
    if (!this.getPermittedMethods().includes(PermissionScopeMethods.SIGN)) {
      throw new MissingRequiredScope(PermissionScopeMethods.SIGN)
    }
    const network = this.getActiveNetwork()
    const account = await this.getPKH()
    this.validateNetworkAndAccount(network, account)

    this.checkWalletReadiness(this.getTopicFromSession(session))

    // TODO: Type
    signClient
      .request<{ signature: string }>({
        topic: session.topic,
        chainId: `${TEZOS_PLACEHOLDER}:${network}`,
        request: {
          method: PermissionScopeMethods.SIGN,
          params: {
            account: account,
            payload: signPayloadRequest.payload
          }
        }
      })
      .then((response) => {
        const signPayloadResponse: SignPayloadResponseInput = {
          type: BeaconMessageType.SignPayloadResponse,
          signingType: signPayloadRequest.signingType,
          signature: response?.signature,
          id: this.messageIds.pop()
        } as SignPayloadResponse

        this.notifyListeners(this.getTopicFromSession(session), signPayloadResponse)
        if (this.session && this.messageIds.length) {
          this.checkWalletReadiness(this.getTopicFromSession(session))
        }
      })
      .catch(async () => {
        const errorResponse: ErrorResponseInput = {
          type: BeaconMessageType.Error,
          id: this.messageIds.pop(),
          errorType: BeaconErrorType.ABORTED_ERROR
        } as ErrorResponse

        this.notifyListeners(this.getTopicFromSession(session), errorResponse)
        if (this.session && this.messageIds.length) {
          this.checkWalletReadiness(this.getTopicFromSession(session))
        }
      })
  }

  /**
   * @description Once the session is established, send Tezos operations to be approved, signed and inject by the wallet.
   * @error MissingRequiredScope is thrown if permission to send operation was not granted
   */
  async sendOperations(operationRequest: OperationRequest) {
    const signClient = await this.getSignClient()

    if (!signClient) {
      return
    }

    const session = this.getSession()

    if (!this.getPermittedMethods().includes(PermissionScopeMethods.OPERATION_REQUEST)) {
      throw new MissingRequiredScope(PermissionScopeMethods.OPERATION_REQUEST)
    }
    const network = this.getActiveNetwork()
    const account = await this.getPKH()
    this.validateNetworkAndAccount(network, account)
    this.checkWalletReadiness(this.getTopicFromSession(session))

    signClient
      .request<{
        // The `operationHash` field should be provided to specify the operation hash,
        // while the `transactionHash` and `hash` fields are supported for backwards compatibility.
        operationHash?: string
        transactionHash?: string
        hash?: string
      }>({
        topic: session.topic,
        chainId: `${TEZOS_PLACEHOLDER}:${network}`,
        request: {
          method: PermissionScopeMethods.OPERATION_REQUEST,
          params: {
            account,
            operations: operationRequest.operationDetails
          }
        }
      })
      .then((response) => {
        const sendOperationResponse: OperationResponseInput = {
          type: BeaconMessageType.OperationResponse,
          transactionHash:
            response.operationHash ?? response.transactionHash ?? response.hash ?? '',
          id: this.messageIds.pop() ?? ''
        }

        this.notifyListeners(this.getTopicFromSession(session), sendOperationResponse)

        if (this.session && this.messageIds.length) {
          this.checkWalletReadiness(this.getTopicFromSession(session))
        }
      })
      .catch(async () => {
        const errorResponse: ErrorResponseInput = {
          type: BeaconMessageType.Error,
          id: this.messageIds.pop(),
          errorType: BeaconErrorType.ABORTED_ERROR
        } as ErrorResponse

        this.notifyListeners(this.getTopicFromSession(session), errorResponse)

        if (this.session && this.messageIds.length) {
          this.checkWalletReadiness(this.getTopicFromSession(session))
        }
      })
  }

  private isMobileSesion(session: SessionTypes.Struct): boolean {
    const redirect = session.peer.metadata.redirect
    return (
      !!redirect &&
      !!redirect.native &&
      !redirect.native.includes('http') &&
      !redirect.native.includes('ws')
    )
  }
  /**
   * Function used to fix appSwitching with web wallets when pairing through 'Other wallet flow'
   * @param session the newly created session
   */
  private updateStorageWallet(session: SessionTypes.Struct): void {
    const selectedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET) ?? '{}')

    if (!selectedWallet.key) {
      return
    }

    if (this.isMobileSesion(session)) {
      selectedWallet.type = 'mobile'
    } else {
      selectedWallet.type = 'web'
    }

    localStorage.setItem(StorageKey.LAST_SELECTED_WALLET, JSON.stringify(selectedWallet))
  }

  public async init(
    forceNewConnection: boolean = false
  ): Promise<{ uri: string; topic: string } | undefined> {
    logger.warn('init')
    this.disconnectionEvents.size && this.disconnectionEvents.clear()

    if (forceNewConnection) {
      await this.closePairings()
    }

    const signClient = await this.getSignClient()

    if (!signClient) {
      const fun = this.eventHandlers.get(ClientEvents.CLOSE_ALERT)
      fun && fun()
      return
    }

    const lastIndex = signClient.session.keys.length - 1

    if (lastIndex > -1) {
      this.session = signClient.session.get(signClient.session.keys[lastIndex])
      this.updateStorageWallet(this.session)
      this.setDefaultAccountAndNetwork()

      return undefined
    }

    logger.warn('before create')

    const permissionScopeParams: PermissionScopeParam = {
      networks: [this.wcOptions.network],
      events: [],
      methods: [
        PermissionScopeMethods.GET_ACCOUNTS,
        PermissionScopeMethods.OPERATION_REQUEST,
        PermissionScopeMethods.SIGN
      ]
    }
    const optionalPermissionScopeParams: PermissionScopeParam = {
      networks: [this.wcOptions.network],
      events: [PermissionScopeEvents.REQUEST_ACKNOWLEDGED],
      methods: []
    }

    const connectParams = {
      requiredNamespaces: {
        [TEZOS_PLACEHOLDER]: this.permissionScopeParamsToNamespaces(permissionScopeParams)
      },
      optionalNamespaces: {
        [TEZOS_PLACEHOLDER]: this.permissionScopeParamsToNamespaces(optionalPermissionScopeParams)
      },
      sessionProperties: {
        ['BEACON_SDK_VERSION']: SDK_VERSION
      }
    }

    const { uri, approval } = await signClient.connect(connectParams)

    // Extract topic from uri. Format is wc:topic@2...
    const topic = getStringBetween(uri, ':', '@')

    if (!topic) {
      return
    }

    let hasResponse = false

    signClient.core.pairing
      .ping({ topic })
      .then(async () => {
        if (!hasResponse) {
          // Only show "waiting for acknowledge" message if pong arrives before response
          const fun = this.eventHandlers.get(ClientEvents.WC_ACK_NOTIFICATION)
          fun && fun('pending')
        }
      })
      .catch((err) => {
        console.error('--------', err)
      })

    approval()
      .then((session) => {
        logger.debug('session open')

        hasResponse = true

        this.updateStorageWallet(session)

        const pairingResponse: ExtendedWalletConnectPairingResponse =
          new ExtendedWalletConnectPairingResponse(
            session.topic,
            session.peer.metadata.name,
            session.peer.publicKey,
            '3',
            session.topic,
            session.peer.metadata.name
          )

        this.channelOpeningListeners.forEach((listener) => {
          listener(pairingResponse)
        })

        if (session?.controller !== this.session?.controller) {
          logger.debug('Controller doesnt match, closing active session', [session.pairingTopic])
          this.activeAccount && this.closeActiveSession(this.activeAccount, false)
          this.session = undefined // close the previous session
        }

        // We need this check in the event the user aborts the sync process on the wallet side
        // but there is already a connection set
        this.session = this.session ?? session
        logger.debug('Session is now', [session.pairingTopic])

        this.validateReceivedNamespace(permissionScopeParams, this.session.namespaces)
      })
      .catch(async (error: any) => {
        hasResponse = true
        if (
          !error.message ||
          !error.message.length ||
          error.message.toLowerCase().includes('expir')
        ) {
          const fun = this.eventHandlers.get(ClientEvents.CLOSE_ALERT)
          fun && fun(TransportType.WALLETCONNECT)
          return
        }

        logger.error('Error happened!', [error.message])

        if (this.activeListeners.size === 0) {
          logger.debug('No active listeners', [])
          const fun = this.eventHandlers.get(ClientEvents.WC_ACK_NOTIFICATION)
          fun && fun('error')
        } else {
          const _pairingTopic = topic ?? signClient.core.pairing.getPairings()[0]?.topic
          logger.debug('New pairing topic?', [])

          const errorResponse: ErrorResponseInput = {
            type: BeaconMessageType.Error,
            id: this.messageIds.pop(),
            errorType: BeaconErrorType.ABORTED_ERROR
          } as ErrorResponse

          this.notifyListeners(_pairingTopic, errorResponse)
        }
      })

    logger.warn('return uri and topic')

    return { uri: uri ?? '', topic: topic }
  }

  public async close() {
    this.storage.backup()
    this.abortErrorBuilder()
    await this.closePairings()
    this.unsubscribeFromEncryptedMessages()
  }

  private subscribeToSessionEvents(signClient: Client): void {
    signClient.on('session_event', (event) => {
      if (
        event.params.event.name === PermissionScopeEvents.REQUEST_ACKNOWLEDGED &&
        this.messageIds.length
      ) {
        this.acknowledgeRequest(this.messageIds[0])
      }
    })

    signClient.on('session_update', (event) => {
      this.disconnectionEvents.add('session_update')
      const session = signClient.session.get(event.topic)

      if (!session) {
        logger.warn('session_update', 'topic does not exist')
        return
      }

      this.session = session

      this.updateActiveAccount(event.params.namespaces, session)
    })

    signClient.on('session_delete', (event) => {
      this.disconnectionEvents.add('session_delete')
      this.disconnect(signClient, { type: 'session', topic: event.topic })
    })

    signClient.on('session_expire', (event) => {
      this.disconnectionEvents.add('session_expire')
      this.disconnect(signClient, { type: 'session', topic: event.topic })
    })
    signClient.core.pairing.events.on('pairing_delete', (event) => {
      this.disconnectionEvents.add('pairing_delete')
      this.disconnect(signClient, { type: 'pairing', topic: event.topic })
    })
    signClient.core.pairing.events.on('pairing_expire', (event) => {
      this.disconnectionEvents.add('pairing_expire')
      this.disconnect(signClient, { type: 'pairing', topic: event.topic })
    })
  }

  private async acknowledgeRequest(id: string) {
    const session = this.getSession()
    const acknowledgeResponse: AcknowledgeResponseInput = {
      type: BeaconMessageType.Acknowledge,
      id
    }

    this.notifyListeners(this.getTopicFromSession(session), acknowledgeResponse)
  }

  private async updateActiveAccount(
    namespaces: SessionTypes.Namespaces,
    session: SessionTypes.Struct
  ) {
    try {
      const accounts = this.getTezosNamespace(namespaces).accounts
      if (accounts.length) {
        const [_namespace, chainId, addressOrPbk] = accounts[0].split(':', 3)
        const session = this.getSession()
        let publicKey: string | undefined

        this.activeNetwork = chainId

        if (addressOrPbk.startsWith('edpk')) {
          publicKey = addressOrPbk
          this.activeAccount = await getAddressFromPublicKey(publicKey)
        } else {
          this.activeAccount = addressOrPbk
          const result = await this.fetchAccounts(session.topic, `${TEZOS_PLACEHOLDER}:${chainId}`)

          publicKey = result?.find(({ address: _address }) => addressOrPbk === _address)?.pubkey
        }

        if (!publicKey) {
          throw new Error('Public key for the new account not provided')
        }

        this.notifyListeners(this.getTopicFromSession(session), {
          id: await generateGUID(),
          type: BeaconMessageType.ChangeAccountRequest,
          publicKey,
          network: { type: chainId as NetworkType },
          scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST],
          walletType: 'implicit'
        })
      } else {
        this.notifyListenersWithPermissionResponse(
          session,
          {
            type: this.wcOptions.network
          },
          'session_update'
        )
      }
    } catch {}
  }

  private async disconnect(
    signClient: Client,
    trigger: { type: 'session'; topic: string } | { type: 'pairing'; topic: string }
  ) {
    let session
    if (trigger.type === 'session') {
      session = await this.onSessionClosed(signClient, trigger.topic)
    }

    if (trigger.type === 'pairing') {
      session = await this.onPairingClosed(signClient, trigger.topic)
    }

    if (!this.activeAccount) {
      const fun = this.eventHandlers.get(ClientEvents.RESET_STATE)
      fun && fun(TransportType.WALLETCONNECT)
    }

    if (!session) {
      return
    }

    this.notifyListeners(this.getTopicFromSession(session), {
      id: await generateGUID(),
      type: BeaconMessageType.Disconnect
    })
    this.clearState()
  }

  private async onPairingClosed(
    signClient: Client,
    topic: string
  ): Promise<SessionTypes.Struct | undefined> {
    const session =
      this.session?.pairingTopic === topic
        ? this.session
        : signClient.session
            .getAll()
            .find((session: SessionTypes.Struct) => session.pairingTopic === topic)

    if (!session) {
      return undefined
    }

    try {
      await signClient.disconnect({
        topic: session.topic,
        reason: {
          code: -1, // TODO: Use constants
          message: 'Pairing deleted'
        }
      })
    } catch (error: any) {
      // If the session was already closed, `disconnect` will throw an error.
      logger.warn(error)
    }

    return session
  }

  private async onSessionClosed(
    signClient: Client,
    sessionTopic: string
  ): Promise<SessionTypes.Struct | undefined> {
    if (!this.session || this.session.topic !== sessionTopic) {
      return undefined
    }

    try {
      // todo close the matching session and not just the first one
      if (!this.session.pairingTopic) {
        await signClient.core.pairing.disconnect({
          topic: signClient.core.pairing.getPairings()[0]?.topic
        })
      } else {
        await signClient.core.pairing.disconnect({ topic: this.session.pairingTopic })
      }
    } catch (error: any) {
      // If the pairing was already closed, `disconnect` will throw an error.
      logger.warn(error.message)
    }

    return this.session
  }

  public async getPairingRequestInfo(): Promise<ExtendedWalletConnectPairingRequest> {
    let _uri = '',
      _topic = ''
    try {
      logger.warn('getPairingRequestInfo')
      const { uri, topic } = (await this.init(true)) ?? { uri: '', topic: '' }
      _uri = uri
      _topic = topic
    } catch (error: any) {
      console.warn(error.message)
    }

    return new ExtendedWalletConnectPairingRequest(
      _topic,
      'WalletConnect',
      await generateGUID(),
      BEACON_VERSION,
      await generateGUID(),
      _uri
    )
  }

  private async closePairings() {
    await this.closeSessions()
    const signClient = await this.getSignClient()

    if (signClient) {
      const pairings = signClient.pairing.getAll() ?? []
      pairings.length &&
        (await Promise.allSettled(
          pairings.map((pairing) =>
            signClient.disconnect({
              topic: pairing.topic,
              reason: {
                code: 0, // TODO: Use constants
                message: 'Force new connection'
              }
            })
          )
        ))
    }

    await this.closeSignClient()
    await this.storage.resetState()
    this.storage.notify('RESET')
  }

  private async closeSessions() {
    const signClient = await this.getSignClient()

    if (signClient) {
      const sessions = signClient.session.getAll() ?? []
      sessions.length &&
        (await Promise.allSettled(
          sessions.map((session) =>
            signClient.disconnect({
              topic: (session as any).topic,
              reason: {
                code: 0, // TODO: Use constants
                message: 'Force new connection'
              }
            })
          )
        ))
    }

    this.clearState()
  }

  private async openSession(): Promise<SessionTypes.Struct> {
    const signClient = (await this.getSignClient())!
    const pairingTopic = signClient.core.pairing.getPairings()[0]?.topic

    logger.debug('Starting open session with', [pairingTopic])

    if (!signClient) {
      throw new Error('Transport error.')
    }

    const permissionScopeParams: PermissionScopeParam = {
      networks: [this.wcOptions.network],
      events: [],
      methods: [
        PermissionScopeMethods.GET_ACCOUNTS,
        PermissionScopeMethods.OPERATION_REQUEST,
        PermissionScopeMethods.SIGN
      ]
    }
    const optionalPermissionScopeParams: PermissionScopeParam = {
      networks: [this.wcOptions.network],
      events: [PermissionScopeEvents.REQUEST_ACKNOWLEDGED],
      methods: []
    }

    const connectParams = {
      requiredNamespaces: {
        [TEZOS_PLACEHOLDER]: this.permissionScopeParamsToNamespaces(permissionScopeParams)
      },
      optionalNamespaces: {
        [TEZOS_PLACEHOLDER]: this.permissionScopeParamsToNamespaces(optionalPermissionScopeParams)
      },
      pairingTopic
    }

    logger.debug('Checking wallet readiness', [pairingTopic])

    this.checkWalletReadiness(pairingTopic)

    try {
      logger.debug('connect', [pairingTopic])
      const { approval } = await signClient.connect(connectParams)
      logger.debug('before await approal', [pairingTopic])
      const session = await approval()
      logger.debug('after await approal, have session', [pairingTopic])
      // if I have successfully opened a session and I already have one opened
      if (session?.controller !== this.session?.controller) {
        logger.debug('Controller doesnt match, closing active session', [pairingTopic])
        this.activeAccount && this.closeActiveSession(this.activeAccount, false)
        this.session = undefined // close the previous session
      }

      // I still need this check in the event the user aborts the sync process on the wallet side
      // but there is already a connection set
      this.session = this.session ?? session
      logger.debug('Session is now', [session.pairingTopic, pairingTopic])

      this.validateReceivedNamespace(permissionScopeParams, this.session.namespaces)
    } catch (error: any) {
      if (
        !error.message ||
        !error.message.length ||
        error.message.toLowerCase().includes('expir')
      ) {
        const fun = this.eventHandlers.get(ClientEvents.CLOSE_ALERT)
        fun && fun(TransportType.WALLETCONNECT)
      } else {
        logger.debug('Error happened!', [pairingTopic])
        logger.error(error.message)
        if (this.activeListeners.size === 0) {
          logger.debug('No active listeners', [pairingTopic])
          const fun = this.eventHandlers.get(ClientEvents.WC_ACK_NOTIFICATION)
          fun && fun('error')
        } else {
          logger.debug('New pairing topic?', [pairingTopic])

          const errorResponse: ErrorResponseInput = {
            type: BeaconMessageType.Error,
            id: this.messageIds.pop(),
            errorType: BeaconErrorType.ABORTED_ERROR
          } as ErrorResponse

          this.notifyListeners(pairingTopic, errorResponse)
        }
      }
    }

    if (this.session) {
      logger.debug('Have session, returning', [pairingTopic])

      return this.session
    } else {
      logger.debug('Nope, aborting', [pairingTopic])

      throw new InvalidSession('No session set.' + pairingTopic)
    }
  }

  private permissionScopeParamsToNamespaces(
    permissionScopeParams: PermissionScopeParam
  ): ProposalTypes.BaseRequiredNamespace {
    return {
      chains: permissionScopeParams.networks.map((network) => `${TEZOS_PLACEHOLDER}:${network}`),
      methods: permissionScopeParams.methods,
      events: permissionScopeParams.events ?? []
    }
  }

  private validateReceivedNamespace(
    scope: PermissionScopeParam,
    receivedNamespaces: Record<string, SessionTypes.Namespace>
  ) {
    if (receivedNamespaces[TEZOS_PLACEHOLDER]) {
      this.validateMethods(scope.methods, receivedNamespaces[TEZOS_PLACEHOLDER].methods)
      if (scope.events) {
        this.validateEvents(scope.events, receivedNamespaces['tezos'].events)
      }
      this.validateAccounts(scope.networks, receivedNamespaces[TEZOS_PLACEHOLDER].accounts)
    } else {
      this.clearState()
      throw new InvalidReceivedSessionNamespace(
        'All namespaces must be approved',
        getSdkError('USER_REJECTED').code,
        'incomplete',
        'tezos'
      )
    }
  }

  private validateMethods(requiredMethods: string[], receivedMethods: string[]) {
    const missingMethods: string[] = []
    requiredMethods.forEach((method) => {
      if (!receivedMethods.includes(method)) {
        missingMethods.push(method)
      }
    })
    if (missingMethods.length > 0) {
      this.clearState()
      throw new InvalidReceivedSessionNamespace(
        'All methods must be approved',
        getSdkError('USER_REJECTED_METHODS').code,
        'incomplete',
        missingMethods
      )
    }
  }

  private validateEvents(requiredEvents: string[], receivedEvents: string[]) {
    const missingEvents: string[] = []
    requiredEvents.forEach((method) => {
      if (!receivedEvents.includes(method)) {
        missingEvents.push(method)
      }
    })
    if (missingEvents.length > 0) {
      this.clearState()
      throw new InvalidReceivedSessionNamespace(
        'All events must be approved',
        getSdkError('USER_REJECTED_EVENTS').code,
        'incomplete',
        missingEvents
      )
    }
  }

  private validateAccounts(requiredNetwork: string[], receivedAccounts: string[]) {
    if (receivedAccounts.length === 0) {
      this.clearState()
      throw new InvalidReceivedSessionNamespace(
        'Accounts must not be empty',
        getSdkError('USER_REJECTED_CHAINS').code,
        'incomplete'
      )
    }
    const receivedChains: string[] = []
    const invalidChains: string[] = []
    const missingChains: string[] = []
    const invalidChainsNamespace: string[] = []

    receivedAccounts.forEach((chain) => {
      const accountId = chain.split(':')
      if (accountId.length !== 3) {
        invalidChains.push(chain)
      }
      if (accountId[0] !== TEZOS_PLACEHOLDER) {
        invalidChainsNamespace.push(chain)
      }
      const network = accountId[1]
      if (!receivedChains.includes(network)) {
        receivedChains.push(network)
      }
    })

    if (invalidChains.length > 0) {
      this.clearState()
      throw new InvalidReceivedSessionNamespace(
        'Accounts must be CAIP-10 compliant',
        getSdkError('USER_REJECTED_CHAINS').code,
        'invalid',
        invalidChains
      )
    }

    if (invalidChainsNamespace.length > 0) {
      this.clearState()
      throw new InvalidReceivedSessionNamespace(
        'Accounts must be defined in matching namespace',
        getSdkError('UNSUPPORTED_ACCOUNTS').code,
        'invalid',
        invalidChainsNamespace
      )
    }
    requiredNetwork.forEach((network) => {
      if (!receivedChains.includes(network)) {
        missingChains.push(network)
      }
    })
    if (missingChains.length > 0) {
      this.clearState()
      throw new InvalidReceivedSessionNamespace(
        'All chains must have at least one account',
        getSdkError('USER_REJECTED_CHAINS').code,
        'incomplete',
        missingChains
      )
    }
  }

  async closeActiveSession(account: string, notify: boolean = true) {
    try {
      this.validateNetworkAndAccount(this.getActiveNetwork(), account)
    } catch (error: any) {
      logger.error(error.message)
      return
    }

    const session = this.getSession()

    if (notify && this.messageIds.length) {
      const errorResponse: any = {
        type: BeaconMessageType.Disconnect,
        id: this.messageIds.pop(),
        errorType: BeaconErrorType.ABORTED_ERROR
      }

      this.notifyListeners(this.getTopicFromSession(session), errorResponse)
      this.messageIds = [] // reset
    }

    await this.signClient?.disconnect({
      topic: session.topic,
      reason: {
        code: 0, // TODO: Use constants
        message: 'Force new connection'
      }
    })
  }

  private validateNetworkAndAccount(network: string, account: string) {
    if (!this.getTezosNamespace().accounts.includes(`${TEZOS_PLACEHOLDER}:${network}:${account}`)) {
      throw new InvalidNetworkOrAccount(network, account)
    }
  }
  /**
   * @description Access the active network
   * @error ActiveNetworkUnspecified thorwn when there are multiple Tezos networks in the session and none is set as the active one
   */
  getActiveNetwork() {
    if (!this.activeNetwork) {
      this.getSession()
      throw new ActiveNetworkUnspecified()
    }
    return this.activeNetwork
  }

  private setDefaultAccountAndNetwork() {
    const activeAccount = this.getAccounts()
    if (activeAccount.length) {
      this.activeAccount = activeAccount[0]
    }
    const activeNetwork = this.getNetworks()
    if (activeNetwork.length) {
      this.activeNetwork = activeNetwork[0]
    }
  }

  /**
   * @description Return all connected accounts from the active session
   * @error NotConnected if no active session
   */
  getAccounts() {
    return this.getTezosNamespace().accounts.map((account) => account.split(':')[2])
  }

  /**
   * @description Return all networks from the namespace of the active session
   * @error NotConnected if no active session
   */
  getNetworks() {
    return this.getPermittedNetwork()
  }
  private getTezosNamespace(namespaces: SessionTypes.Namespaces = this.getSession().namespaces): {
    accounts: string[]
    methods: string[]
    events: string[]
  } {
    if (TEZOS_PLACEHOLDER in namespaces) {
      return namespaces[TEZOS_PLACEHOLDER]
    } else {
      throw new InvalidSession('Tezos not found in namespaces')
    }
  }
  private getPermittedMethods() {
    return this.getTezosRequiredNamespace().methods
  }

  private getPermittedNetwork() {
    return this.getTezosRequiredNamespace().chains.map((chain) => chain.split(':')[1])
  }

  private getTezosRequiredNamespace(): {
    chains: string[]
    methods: string[]
    events: string[]
  } {
    return {
      chains: [`${TEZOS_PLACEHOLDER}:${this.wcOptions.network}`],
      events: [],
      methods: ['tezos_getAccounts', 'tezos_send', 'tezos_sign']
    }
    // if (TEZOS_PLACEHOLDER in this.getSession().requiredNamespaces) {
    //   return this.getSession().requiredNamespaces[TEZOS_PLACEHOLDER] as {
    //     chains: string[]
    //     methods: string[]
    //     events: string[]
    //   }
    // } else {
    //   throw new InvalidSession('Tezos not found in requiredNamespaces')
    // }
  }

  private async notifyListeners(topic: string, partialResponse: BeaconInputMessage) {
    const response: BeaconBaseMessage = {
      ...partialResponse,
      version: '2',
      senderId: topic
    }
    const serializer = new Serializer()
    const serialized = await serializer.serialize(response)

    this.activeListeners.forEach((listener) => {
      listener(serialized)
    })
  }

  public currentSession(): SessionTypes.Struct | undefined {
    return this.session
  }

  private async getSignClient(): Promise<Client | undefined> {
    if (this.signClient === undefined) {
      try {
        this.signClient = await Client.init(this.wcOptions.opts)
        this.subscribeToSessionEvents(this.signClient)
      } catch (error: any) {
        logger.error(error.message)
        return undefined
      }
    }

    return this.signClient
  }

  private getSession() {
    if (!this.session) {
      throw new NotConnected()
    }
    return this.session!
  }

  /**
   * @description Access the public key hash of the active account
   * @error ActiveAccountUnspecified thrown when there are multiple Tezos account in the session and none is set as the active one
   */
  async getPKH() {
    if (!this.activeAccount) {
      this.getSession()
      throw new ActiveAccountUnspecified()
    }
    return this.activeAccount
  }

  private clearState() {
    this.session = undefined
    this.activeAccount = undefined
    this.activeNetwork = undefined
  }
}
