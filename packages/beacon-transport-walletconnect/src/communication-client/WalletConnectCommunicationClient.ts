import { BEACON_VERSION, CommunicationClient, Serializer } from '@airgap/beacon-core'
import { SignClient } from '@walletconnect/sign-client'
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
  NetworkType,
  OperationRequest,
  OperationResponseInput,
  Optional,
  PermissionRequest,
  PermissionResponseInput,
  PermissionScope,
  SignPayloadRequest,
  SignPayloadResponse,
  SignPayloadResponseInput
} from '@airgap/beacon-types'
import { generateGUID, getAddressFromPublicKey } from '@airgap/beacon-utils'

const TEZOS_PLACEHOLDER = 'tezos'

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

export class WalletConnectCommunicationClient extends CommunicationClient {
  protected readonly activeListeners: Map<string, (message: string) => void> = new Map()

  protected readonly channelOpeningListeners: Map<
    string,
    (pairingResponse: ExtendedWalletConnectPairingResponse) => void
  > = new Map()

  private static instance: WalletConnectCommunicationClient
  public signClient: Client | undefined
  private session: SessionTypes.Struct | undefined
  private activeAccount: string | undefined
  private activeNetwork: string | undefined

  private currentMessageId: string | undefined // TODO JGD we shouldn't need this

  constructor(private wcOptions: { network: NetworkType; opts: SignClientTypes.Options }) {
    super()
    this.getSignClient()
  }

  static getInstance(wcOptions: {
    network: NetworkType
    opts: SignClientTypes.Options
  }): WalletConnectCommunicationClient {
    if (!WalletConnectCommunicationClient.instance) {
      WalletConnectCommunicationClient.instance = new WalletConnectCommunicationClient(wcOptions)
    }
    return WalletConnectCommunicationClient.instance
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

  async unsubscribeFromEncryptedMessages(): Promise<void> {
    // implementation
  }

  async unsubscribeFromEncryptedMessage(_senderPublicKey: string): Promise<void> {
    // implementation
  }

  async sendMessage(_message: string, _peer?: any): Promise<void> {
    const serializer = new Serializer()
    const message = (await serializer.deserialize(_message)) as any

    this.currentMessageId = message.id

    if (message?.type === BeaconMessageType.PermissionRequest) {
      this.requestPermissions(message)
    }

    if (message?.type === BeaconMessageType.OperationRequest) {
      this.sendOperations(message)
    }

    if (message?.type === BeaconMessageType.SignPayloadRequest) {
      this.signPayload(message)
    }
  }

  private async fetchAccounts(topic: string, chainId: string) {
    const signClient = await this.getSignClient()
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

  async requestPermissions(message: PermissionRequest) {
    console.log('#### Requesting permissions')

    if (!this.getPermittedMethods().includes(PermissionScopeMethods.GET_ACCOUNTS)) {
      throw new MissingRequiredScope(PermissionScopeMethods.GET_ACCOUNTS)
    }

    if (this.activeAccount) {
      await this.closeSessions()
      await this.openSession()
    }

    this.setDefaultAccountAndNetwork()

    const session = this.getSession()
    let publicKey: string | undefined

    if (
      session.sessionProperties?.pubkey &&
      session.sessionProperties?.algo &&
      session.sessionProperties?.address
    ) {
      publicKey = session.sessionProperties?.pubkey
      console.log(
        '[requestPermissions]: Have pubkey in sessionProperties, skipping "get_accounts" call',
        session.sessionProperties
      )
    } else {
      const accounts = this.getTezosNamespace(session.namespaces).accounts
      const addressOrPbk = accounts[0].split(':', 3)[2]

      if (addressOrPbk.startsWith('edpk')) {
        publicKey = addressOrPbk
      } else {
        if (message.network.type !== this.wcOptions.network) {
          throw new Error('Network in permission request is not the same as preferred network!')
        }

        const result = await this.fetchAccounts(
          session.topic,
          `${TEZOS_PLACEHOLDER}:${message.network.type}`
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
        senderId: session.pairingTopic,
        name: session.peer.metadata.name,
        icon: session.peer.metadata.icons[0]
      },
      publicKey,
      network: message.network,
      scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST],
      id: this.currentMessageId!
    }

    this.notifyListeners(session, permissionResponse)
  }

  /**
   * @description Once the session is establish, send payload to be approved and signed by the wallet.
   * @error MissingRequiredScope is thrown if permission to sign payload was not granted
   */
  async signPayload(signPayloadRequest: SignPayloadRequest) {
    const signClient = await this.getSignClient()
    const session = this.getSession()
    if (!this.getPermittedMethods().includes(PermissionScopeMethods.SIGN)) {
      throw new MissingRequiredScope(PermissionScopeMethods.SIGN)
    }
    const network = this.getActiveNetwork()
    const account = await this.getPKH()
    this.validateNetworkAndAccount(network, account)

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
          id: this.currentMessageId!
        } as SignPayloadResponse

        this.notifyListeners(session, signPayloadResponse)
      })
      .catch(async () => {
        const errorResponse: ErrorResponseInput = {
          type: BeaconMessageType.Error,
          id: this.currentMessageId!,
          errorType: BeaconErrorType.ABORTED_ERROR
        } as ErrorResponse

        this.notifyListeners(session, errorResponse)
      })
  }

  /**
   * @description Once the session is established, send Tezos operations to be approved, signed and inject by the wallet.
   * @error MissingRequiredScope is thrown if permission to send operation was not granted
   */
  async sendOperations(operationRequest: OperationRequest) {
    const signClient = await this.getSignClient()
    const session = this.getSession()

    if (!this.getPermittedMethods().includes(PermissionScopeMethods.OPERATION_REQUEST)) {
      throw new MissingRequiredScope(PermissionScopeMethods.OPERATION_REQUEST)
    }
    const network = this.getActiveNetwork()
    const account = await this.getPKH()
    this.validateNetworkAndAccount(network, account)

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
          id: this.currentMessageId!
        }

        this.notifyListeners(session, sendOperationResponse)
      })
      .catch(async () => {
        const errorResponse: ErrorResponseInput = {
          type: BeaconMessageType.Error,
          id: this.currentMessageId!,
          errorType: BeaconErrorType.ABORTED_ERROR
        } as ErrorResponse

        this.notifyListeners(session, errorResponse)
      })
  }

  public async init(
    forceNewConnection: boolean = false
  ): Promise<{ uri: string; topic: string } | undefined> {
    const signClient = await this.getSignClient()

    if (forceNewConnection) {
      this.closePairings()
    }

    const sessions = signClient.session.getAll()
    if (sessions && sessions.length > 0) {
      this.session = sessions[0]
      this.setDefaultAccountAndNetwork()
      return undefined
    }

    const { uri, topic } = await signClient.core.pairing.create()
    signClient.core.pairing.ping({ topic }).then(async () => {
      await signClient.core.pairing.activate({ topic })

      // pairings don't have peer details
      // therefore we must immediately open a session
      // to get data required in the pairing response
      const session = await this.openSession(topic)
      const pairingResponse = {
        id: topic,
        type: 'walletconnect-pairing-response',
        name: session.peer.metadata.name,
        publicKey: session.peer.publicKey,
        senderId: topic,
        extensionId: session.peer.metadata.name,
        version: '3'
      } as ExtendedWalletConnectPairingResponse

      this.channelOpeningListeners.forEach((listener) => {
        listener(pairingResponse)
      })
    })

    return { uri, topic }
  }

  public async close() {
    await this.closePairings()
  }

  private subscribeToSessionEvents(signClient: Client): void {
    signClient.on('session_event', (event) => {
      if (
        event.params.event.name === PermissionScopeEvents.REQUEST_ACKNOWLEDGED &&
        this.currentMessageId
      ) {
        this.acknowledgeRequest(this.currentMessageId)
      }
    })

    signClient.on('session_update', (event) => {
      this.updateActiveAccount(event.params.namespaces)
    })

    signClient.on('session_delete', (event) => {
      this.disconnect(signClient, { type: 'session', topic: event.topic })
    })

    signClient.on('session_expire', (event) => {
      this.disconnect(signClient, { type: 'session', topic: event.topic })
    })

    signClient.core.pairing.events.on('pairing_delete', (event) => {
      this.disconnect(signClient, { type: 'pairing', topic: event.topic })
    })
  }

  private async acknowledgeRequest(id: string) {
    const session = this.getSession()
    const acknowledgeResponse: AcknowledgeResponseInput = {
      type: BeaconMessageType.Acknowledge,
      id
    }

    this.notifyListeners(session, acknowledgeResponse)
  }

  private async updateActiveAccount(namespaces: SessionTypes.Namespaces) {
    try {
      const accounts = this.getTezosNamespace(namespaces).accounts
      if (accounts.length === 1) {
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

        this.notifyListeners(session, {
          id: await generateGUID(),
          type: BeaconMessageType.ChangeAccountRequest,
          publicKey,
          network: { type: chainId as NetworkType },
          scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST]
        })
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

    if (!session) {
      return
    }

    this.notifyListeners(session, {
      id: await generateGUID(),
      type: BeaconMessageType.Disconnect
    })
    this.clearState()
  }

  private async onPairingClosed(
    signClient: Client,
    pairingTopic: string
  ): Promise<SessionTypes.Struct | undefined> {
    const session =
      this.session?.pairingTopic === pairingTopic
        ? this.session
        : signClient.session
            .getAll()
            .find((session: SessionTypes.Struct) => session.pairingTopic === pairingTopic)

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
    } catch (error) {
      // If the session was already closed, `disconnect` will throw an error.
      console.warn(error)
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
      await signClient.core.pairing.disconnect({ topic: this.session.pairingTopic })
    } catch (error) {
      // If the pairing was already closed, `disconnect` will throw an error.
      console.warn(error)
    }

    return this.session
  }

  public async getPairingRequestInfo(): Promise<ExtendedWalletConnectPairingRequest> {
    const { uri, topic } = (await this.init(true)) ?? {}
    return {
      id: topic!,
      type: 'walletconnect-pairing-request',
      name: 'WalletConnect',
      version: BEACON_VERSION,
      uri: uri!,
      senderId: await generateGUID(),
      publicKey: await generateGUID()
    }
  }

  private async closePairings() {
    await this.closeSessions()
    const signClient = await this.getSignClient()
    const pairings = signClient.pairing.getAll() ?? []
    for (let pairing of pairings) {
      await signClient.core.pairing.disconnect({ topic: pairing.topic })
    }
  }

  private async closeSessions() {
    const signClient = await this.getSignClient()
    const sessions = signClient.session.getAll() ?? []
    for (let session of sessions) {
      await signClient.disconnect({
        topic: session.topic,
        reason: {
          code: 0, // TODO: Use constants
          message: 'Force new connection'
        }
      })
    }

    this.clearState()
  }

  private async openSession(pairingTopic?: string): Promise<SessionTypes.Struct> {
    const signClient = await this.getSignClient()
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
      pairingTopic: pairingTopic ?? signClient.core.pairing.getPairings()[0]?.topic
    }

    const { approval } = await signClient.connect(connectParams)
    const session = await approval()

    this.session = this.session ?? (session as SessionTypes.Struct)
    this.validateReceivedNamespace(permissionScopeParams, this.session.namespaces)

    return this.session
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
  private validateNetworkAndAccount(network: string, account: string) {
    if (!this.getTezosNamespace().accounts.includes(`${TEZOS_PLACEHOLDER}:${network}:${account}`)) {
      throw new InvalidNetworkOrAccount(network, account)
    }
  }
  /**
   * @description Access the active network
   * @error ActiveNetworkUnspecified thorwn when there are multiple Tezos netwroks in the session and none is set as the active one
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
    if (activeAccount.length === 1) {
      this.activeAccount = activeAccount[0]
    }
    const activeNetwork = this.getNetworks()
    if (activeNetwork.length === 1) {
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

  private async notifyListeners(session: SessionTypes.Struct, partialResponse: BeaconInputMessage) {
    const response: BeaconBaseMessage = {
      ...partialResponse,
      version: '2',
      senderId: session.pairingTopic
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

  private async getSignClient(): Promise<Client> {
    if (this.signClient === undefined) {
      this.signClient = await SignClient.init(this.wcOptions.opts)
      this.subscribeToSessionEvents(this.signClient)
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
