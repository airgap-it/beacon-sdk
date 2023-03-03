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
  BeaconMessageType,
  ConnectionContext,
  ExtendedWalletConnectPairingRequest,
  ExtendedWalletConnectPairingResponse,
  OperationRequest,
  Origin,
  PermissionScope,
  SignPayloadRequest,
  SignPayloadResponse
} from '@airgap/beacon-types'
import { generateGUID } from '@airgap/beacon-utils'

const TEZOS_PLACEHOLDER = 'tezos'

export enum NetworkType {
  MAINNET = 'mainnet',
  GHOSTNET = 'ghostnet',
  MONDAYNET = 'mondaynet',
  DAILYNET = 'dailynet',
  KATHMANDUNET = 'kathmandunet',
  LIMANET = 'limanet'
}

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

export class WalletConnectCommunicationClient extends CommunicationClient {
  protected readonly activeListeners: Map<
    string,
    (message: string, context: ConnectionContext) => void
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

  constructor(private wcOptions: SignClientTypes.Options) {
    super()
  }

  static getInstance(wcOptions: SignClientTypes.Options): WalletConnectCommunicationClient {
    if (!WalletConnectCommunicationClient.instance) {
      WalletConnectCommunicationClient.instance = new WalletConnectCommunicationClient(wcOptions)
    }
    return WalletConnectCommunicationClient.instance
  }

  public async listenForEncryptedMessage(
    senderPublicKey: string,
    messageCallback: (message: string, context: ConnectionContext) => void
  ): Promise<void> {
    if (this.activeListeners.has(senderPublicKey)) {
      return
    }

    const callbackFunction = async (message: string, context: ConnectionContext): Promise<void> => {
      messageCallback(message, context)
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
      this.requestPermissions()
    }

    if (message?.type === BeaconMessageType.OperationRequest) {
      this.sendOperations(message)
    }

    if (message?.type === BeaconMessageType.SignPayloadRequest) {
      this.signPayload(message)
    }
  }

  async requestPermissions() {
    console.log('#### Requesting permissions')

    const session = this.getSession()
    if (!this.getPermittedMethods().includes(PermissionScopeMethods.GET_ACCOUNTS)) {
      throw new MissingRequiredScope(PermissionScopeMethods.GET_ACCOUNTS)
    }
    const network = this.getActiveNetwork()

    console.log('#### Requesting public keys')

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
      chainId: `${TEZOS_PLACEHOLDER}:${network}`,
      request: {
        method: PermissionScopeMethods.GET_ACCOUNTS,
        params: {}
      }
    })

    console.log('##### GET ACCOUNTS', result)

    if (!result || result.length < 1) {
      throw new Error('No account shared by wallet')
    }

    const serializer = new Serializer()
    const serialized = await serializer.serialize({
      type: BeaconMessageType.PermissionResponse,
      appMetadata: {
        senderId: this.session?.peer.publicKey,
        name: this.session?.peer.metadata.name
      },
      publicKey: result[0]?.pubkey,
      network: { type: NetworkType.MAINNET },
      scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST],
      id: this.currentMessageId!
    })
    this.activeListeners.forEach((listener) => {
      listener(serialized, {
        origin: Origin.WALLETCONNECT,
        id: this.currentMessageId!
      })
    })
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
    const response = await this.signClient?.request<{ signature: string }>({
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

    const serializer = new Serializer()
    const signPayloadResponse = {
      type: BeaconMessageType.SignPayloadResponse,
      signingType: signPayloadRequest.signingType,
      signature: response?.signature,
      id: this.currentMessageId!
    } as SignPayloadResponse

    const serialized = await serializer.serialize(signPayloadResponse)

    this.activeListeners.forEach((listener) => {
      listener(serialized, {
        origin: Origin.WALLETCONNECT,
        id: this.currentMessageId!
      })
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
    const response = await this.signClient?.request<{ hash: string }>({
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

    if (response) {
      const serializer = new Serializer()
      const serialized = await serializer.serialize({
        type: BeaconMessageType.OperationResponse,
        transactionHash: response.hash,
        id: this.currentMessageId!
      })
      this.activeListeners.forEach((listener) => {
        listener(serialized, {
          origin: Origin.WALLETCONNECT,
          id: this.currentMessageId!
        })
      })
    }
    return response?.hash
  }

  public async init(forceNewConnection: boolean = false): Promise<string | undefined> {
    const connectParams = {
      permissionScope: {
        networks: [NetworkType.MAINNET],
        events: [],
        methods: [
          PermissionScopeMethods.GET_ACCOUNTS,
          PermissionScopeMethods.OPERATION_REQUEST,
          PermissionScopeMethods.SIGN
        ]
      },
      pairingTopic: undefined
    }

    this.signClient = await SignClient.init(this.wcOptions)

    let sessions = this.signClient.session.getAll()

    if (forceNewConnection) {
      for (let session of sessions) {
        await this.signClient.disconnect({
          topic: session.topic,
          reason: {
            code: 0,
            message: 'Force new connection'
          }
        })
      }

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

  private getTezosNamespace(): {
    accounts: string[]
    methods: string[]
    events: string[]
  } {
    if (TEZOS_PLACEHOLDER in this.getSession().namespaces) {
      return this.getSession().namespaces[TEZOS_PLACEHOLDER]
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
    // TODO: Remove testing code
    return {
      chains: ['tezos:mainnet'],
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
