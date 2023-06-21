import { BEACON_VERSION, CommunicationClient, Serializer } from '@airgap/beacon-core'
import { SignClient } from '@walletconnect/sign-client'
import Client from '@walletconnect/sign-client'
import { SessionTypes, SignClientTypes } from '@walletconnect/types'
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
import { generateGUID } from '@airgap/beacon-utils'

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
  ACCOUNTS_CHANGED = 'accountsChanged'
}

type BeaconInputMessage = BeaconResponseInputMessage | Optional<DisconnectMessage, IgnoredResponseInputProperties> | Optional<ChangeAccountRequest, IgnoredResponseInputProperties>

export class WalletConnectCommunicationClient extends CommunicationClient {
  protected readonly activeListeners: Map<
    string,
    (message: string) => void
  > = new Map()

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

  async requestPermissions(message: PermissionRequest) {
    console.log('#### Requesting permissions')

    const session = this.getSession()
    if (!this.getPermittedMethods().includes(PermissionScopeMethods.GET_ACCOUNTS)) {
      throw new MissingRequiredScope(PermissionScopeMethods.GET_ACCOUNTS)
    }

    console.log('#### Requesting public keys')

    if (message.network.type !== this.wcOptions.network) {
      throw new Error('Network in permission request is not the same as preferred network!')
    }

    // Get the public key from the wallet
    const result = await this.signClient?.request<
      [
        {
          algo: 'ed25519'
          address: string
          pubkey: string
        }
      ]
    >({
      topic: session.topic,
      chainId: `${TEZOS_PLACEHOLDER}:${message.network.type}`,
      request: {
        method: PermissionScopeMethods.GET_ACCOUNTS,
        params: {}
      }
    })

    console.log('##### GET ACCOUNTS', result)

    if (!result || result.length < 1) {
      throw new Error('No account shared by wallet')
    }

    if (result.some((account) => !account.pubkey)) {
      throw new Error('Public Key in `tezos_getAccounts` is empty!')
    }

    const permissionResponse: PermissionResponseInput = {
      type: BeaconMessageType.PermissionResponse,
      appMetadata: {
        senderId: session.peer.publicKey,
        name: session.peer.metadata.name,
        icon: session.peer.metadata.icons[0]
      },
      publicKey: result[0]?.pubkey,
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
    const session = this.getSession()
    if (!this.getPermittedMethods().includes(PermissionScopeMethods.SIGN)) {
      throw new MissingRequiredScope(PermissionScopeMethods.SIGN)
    }
    const network = this.getActiveNetwork()
    const account = await this.getPKH()
    this.validateNetworkAndAccount(network, account)

    // TODO: Type
    this.signClient
      ?.request<{ signature: string }>({
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
    const session = this.getSession()

    if (!this.getPermittedMethods().includes(PermissionScopeMethods.OPERATION_REQUEST)) {
      throw new MissingRequiredScope(PermissionScopeMethods.OPERATION_REQUEST)
    }
    const network = this.getActiveNetwork()
    const account = await this.getPKH()
    this.validateNetworkAndAccount(network, account)

    this.signClient
      ?.request<{
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

  public async init(forceNewConnection: boolean = false): Promise<string | undefined> {
    const connectParams = {
      permissionScope: {
        networks: [this.wcOptions.network],
        events: [],
        methods: [
          PermissionScopeMethods.GET_ACCOUNTS,
          PermissionScopeMethods.OPERATION_REQUEST,
          PermissionScopeMethods.SIGN
        ]
      },
      pairingTopic: undefined
    }

    const signClient = await SignClient.init(this.wcOptions.opts)
    this.signClient = signClient
    this.subscribeToSessionEvents()

    let pairings = this.signClient.pairing.getAll()
    let sessions = this.signClient.session.getAll()

    if (forceNewConnection) {
      await Promise.all([
        Promise.all(
          sessions.map((session) => {
            return signClient.disconnect({
              topic: session.topic,
              reason: {
                code: 0, // TODO: Use constants
                message: 'Force new connection'
              }
            })
          })
        ),
        Promise.all(
          pairings.map((pairing) => {
            return signClient.core.pairing.disconnect({ topic: pairing.topic })
          })
        )
      ])

      this.clearState()

      sessions = this.signClient.session.getAll()
    }

    if (sessions && sessions.length > 0) {
      this.session = sessions[0]
      this.setDefaultAccountAndNetwork()
      return
    }

    const { uri, approval } = await this.signClient.connect({
      requiredNamespaces: {
        [TEZOS_PLACEHOLDER]: {
          chains: connectParams.permissionScope.networks.map(
            (network) => `${TEZOS_PLACEHOLDER}:${network}`
          ),
          methods: connectParams.permissionScope.methods,
          events: connectParams.permissionScope.events ?? []
        }
      },
      pairingTopic: connectParams.pairingTopic
    })

    approval().then(async (session) => {
      this.session = this.session ?? (session as SessionTypes.Struct)
      this.validateReceivedNamespace(connectParams.permissionScope, this.session.namespaces)
      this.setDefaultAccountAndNetwork()

      const pairingResponse = {
        id: this.session.peer.publicKey,
        type: 'walletconnect-pairing-response',
        name: session.peer.metadata.name,
        publicKey: session.peer.publicKey,
        senderId: this.session.peer.publicKey,
        extensionId: this.session.peer.metadata.name,
        version: '3'
      } as ExtendedWalletConnectPairingResponse

      this.channelOpeningListeners.forEach((listener) => {
        listener(pairingResponse)
      })
    })

    return uri
  }

  private subscribeToSessionEvents(): void {
    this.signClient?.on('session_update', (event) => {
      this.updateActiveAccount(event.params.namespaces)
    })

    this.signClient?.on('session_delete', (event) => {
      this.disconnect(event.topic)
    })

    this.signClient?.on('session_expire', (event) => {
      this.disconnect(event.topic)
    })
  }

  private async updateActiveAccount(namespaces: SessionTypes.Namespaces) {
    try {
      const accounts = this.getTezosNamespace(namespaces).accounts
      if (accounts.length === 1) {
        const [_namespace, chainId, address] = accounts[0].split(':', 3)
        this.activeAccount = address
        this.activeNetwork = chainId

        const session = this.getSession()

        // Get the public key from the wallet
        const result = await this.signClient?.request<
          [
            {
              algo: 'ed25519'
              address: string
              pubkey: string
            }
          ]
        >({
          topic: session.topic,
          chainId: `${TEZOS_PLACEHOLDER}:${chainId}`,
          request: {
            method: PermissionScopeMethods.GET_ACCOUNTS,
            params: {}
          }
        })

        const publicKey = result?.find(({ address: _address }) => address === _address )?.pubkey
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

  private async disconnect(topic: string) {
    if (!this.session || this.session.topic !== topic) {
      return
    }

    this.notifyListeners(this.session, {
      id: await generateGUID(),
      type: BeaconMessageType.Disconnect,
    })
    this.clearState()
  }

  public async getPairingRequestInfo(): Promise<ExtendedWalletConnectPairingRequest> {
    const uri = await this.init(true)
    return {
      id: await generateGUID(),
      type: 'walletconnect-pairing-request',
      name: 'WalletConnect',
      version: BEACON_VERSION,
      uri: uri!,
      senderId: await generateGUID(),
      publicKey: await generateGUID()
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

  private async notifyListeners(
    session: SessionTypes.Struct,
    partialResponse: BeaconInputMessage
  ) {
    const response: BeaconBaseMessage = {
      ...partialResponse,
      version: '2',
      senderId: session.peer.publicKey
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
