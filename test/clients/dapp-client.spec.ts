import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import {
  AccountInfo,
  AccountManager,
  BeaconErrorType,
  BeaconEvent,
  BeaconMessageType,
  BEACON_VERSION,
  BroadcastResponse,
  ConnectionContext,
  DAppClient,
  LocalStorage,
  NetworkType,
  OperationResponse,
  Origin,
  P2PPairingRequest,
  P2PTransport,
  PartialTezosOperation,
  PermissionResponse,
  PermissionScope,
  SignPayloadResponse,
  StorageKey,
  TezosOperationType,
  TransportType
} from '../../src'

import { MockTransport } from '../test-utils/MockTransport'
import { availableTransports } from '../../src/utils/available-transports'
import { ExposedPromise } from '../../src/utils/exposed-promise'
import { Logger } from '../../src/utils/Logger'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const peer1: P2PPairingRequest = {
  name: 'test',
  version: BEACON_VERSION,
  publicKey: 'my-public-key',
  relayServer: 'test-relay.walletbeacon.io'
}

const peer2: P2PPairingRequest = {
  name: 'test',
  version: BEACON_VERSION,
  publicKey: 'my-public-key-2',
  relayServer: 'test-relay.walletbeacon.io'
}

const account1: AccountInfo = {
  accountIdentifier: 'a1',
  senderId: 'id1',
  origin: {
    type: Origin.P2P,
    id: peer1.publicKey
  },
  address: 'tz1',
  publicKey: 'pubkey1',
  network: { type: NetworkType.MAINNET },
  scopes: [PermissionScope.SIGN],
  connectedAt: new Date().getTime()
}

const account2: AccountInfo = {
  accountIdentifier: 'a2',
  senderId: 'id2',
  origin: {
    type: Origin.P2P,
    id: peer1.publicKey
  },
  address: 'tz2',
  publicKey: 'pubkey2',
  network: { type: NetworkType.MAINNET },
  scopes: [PermissionScope.SIGN],
  connectedAt: new Date().getTime()
}

/**
 * This mocks the response of PostMessageTransport.isAvailable. Usually it would wait 200ms making the tests slower
 *
 * @param client WalletClient
 */
const initClientWithMock = async (client: DAppClient) => {
  const extensionRef = availableTransports.extension
  availableTransports.extension = Promise.resolve(false)

  await client.init()

  availableTransports.extension = extensionRef
}

describe(`DAppClient`, () => {
  before(function () {
    /**
     * This is used to mock the window object
     *
     * We cannot do it globally because it fails in the storage tests because of security policies
     */
    this.jsdom = require('jsdom-global')()
  })

  after(function () {
    /**
     * Remove jsdom again because it's only needed in this test
     */
    this.jsdom()
    sinon.restore()
  })

  beforeEach(() => {
    sinon.restore()
  })

  it(`should throw an error if initialized with an empty object`, async () => {
    try {
      const dAppClient = new DAppClient({} as any)
      expect(dAppClient).to.be.undefined
    } catch (e) {
      expect(e.message).to.equal('Name not set')
    }
  })

  it(`should initialize without an error`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })
    expect(dAppClient).to.not.be.undefined
  })

  it(`should read active account from storage during initialization`, async () => {
    const storage = new LocalStorage()
    const storageStub = sinon.stub(storage, 'get').resolves()

    const message: PermissionResponse = {
      id: 'some-id',
      version: BEACON_VERSION,
      senderId: 'sender-id',
      type: BeaconMessageType.PermissionResponse,
      publicKey: 'pubkey1',
      network: { type: NetworkType.MAINNET },
      scopes: []
    }
    const contextInfo: ConnectionContext = {
      origin: Origin.P2P,
      id: 'some-context-id'
    }

    const setActiveAccountStub = sinon.stub(DAppClient.prototype, 'setActiveAccount').resolves()

    const dAppClient = new DAppClient({ name: 'Test', storage: storage })
    await (<any>dAppClient).handleResponse(message, contextInfo)

    expect(storageStub.callCount).to.equal(2)
    expect(storageStub.firstCall.args[0]).to.equal(StorageKey.BEACON_SDK_SECRET_SEED)
    expect(storageStub.secondCall.args[0]).to.equal(StorageKey.ACTIVE_ACCOUNT)
    expect(setActiveAccountStub.callCount).to.equal(1)
    expect(setActiveAccountStub.firstCall.args[0]).to.be.undefined
  })

  it(`should have a beacon ID`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })
    expect(typeof (await dAppClient.beaconId)).to.equal('string')
  })

  it(`should connect and be ready`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      await dAppClient.init(true, new MockTransport('TestTransport'))
      await dAppClient.connect()
      await dAppClient.ready

      clearTimeout(timeout)
      expect(await dAppClient.isConnected).to.be.true
      resolve()
    })
  })

  it(`should select P2P Transport`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      await initClientWithMock(dAppClient)

      clearTimeout(timeout)
      expect((await (dAppClient as any).transport).type).to.equal(TransportType.P2P)
      resolve()
    })
  })

  it(`should select ChromeTransport`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      const extensionRef = availableTransports.extension
      availableTransports.extension = Promise.resolve(true)

      const type = await dAppClient.init()

      availableTransports.extension = extensionRef

      clearTimeout(timeout)
      expect(type).to.equal(TransportType.POST_MESSAGE)
      expect((await (dAppClient as any).transport).type).to.equal(TransportType.POST_MESSAGE)
      resolve()
    })
  })

  it(`should get active account`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const activeAccount = await dAppClient.getActiveAccount()

    expect(activeAccount).to.be.undefined
  })

  it(`should set active account`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    let activeAccount: AccountInfo | undefined

    activeAccount = await dAppClient.getActiveAccount()
    expect(activeAccount).to.be.undefined

    const account1: AccountInfo = {
      accountIdentifier: 'a1',
      senderId: 'id1',
      origin: {
        type: Origin.P2P,
        id: 'o1'
      },
      address: 'tz1',
      publicKey: 'pubkey1',
      network: { type: NetworkType.MAINNET },
      scopes: [PermissionScope.SIGN],
      connectedAt: new Date().getTime()
    }

    await dAppClient.setActiveAccount(account1)

    activeAccount = await dAppClient.getActiveAccount()
    expect(activeAccount).to.deep.equal(account1)

    await dAppClient.setActiveAccount()

    activeAccount = await dAppClient.getActiveAccount()
    expect(activeAccount).to.be.undefined
  })

  it(`should get app metadata`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const metadata = await dAppClient.getAppMetadata()

    expect(metadata).to.deep.equal({
      senderId: await dAppClient.beaconId,
      name: dAppClient.name,
      icon: dAppClient.iconUrl
    })
  })

  it(`should connect`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      await dAppClient.init(true, new MockTransport('TestTransport'))
      await dAppClient.connect()
      await dAppClient.ready

      clearTimeout(timeout)
      expect(await dAppClient.isConnected).to.be.true
      resolve()
    })
  })

  it(`should remove an account and unset active account`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    await (<any>dAppClient).accountManager.addAccount(account1)
    await (<any>dAppClient).accountManager.addAccount(account2)
    await dAppClient.setActiveAccount(account1)

    expect(await dAppClient.getAccounts()).to.deep.equal([account1, account2])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(account1)

    await dAppClient.removeAccount(account1.accountIdentifier)

    expect(await dAppClient.getAccounts()).to.deep.equal([account2])
    expect(await dAppClient.getActiveAccount()).to.be.undefined
  })

  it(`should remove an account and not unset active account`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    await (<any>dAppClient).accountManager.addAccount(account1)
    await (<any>dAppClient).accountManager.addAccount(account2)
    await dAppClient.setActiveAccount(account1)

    expect(await dAppClient.getAccounts()).to.deep.equal([account1, account2])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(account1)

    await dAppClient.removeAccount(account2.accountIdentifier)

    expect(await dAppClient.getAccounts()).to.deep.equal([account1])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(account1)
  })

  it(`should remove all accounts and unset active account`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    await (<any>dAppClient).accountManager.addAccount(account1)
    await (<any>dAppClient).accountManager.addAccount(account2)
    await dAppClient.setActiveAccount(account1)

    expect(await dAppClient.getAccounts()).to.deep.equal([account1, account2])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(account1)

    await dAppClient.removeAllAccounts()

    expect(await dAppClient.getAccounts()).to.deep.equal([])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(undefined)
  })

  it(`should remove peer and all its accounts`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const transportRemovePeerStub = sinon.stub(P2PTransport.prototype, 'removePeer').resolves()
    const removeAccountsForPeersStub = sinon
      .stub(dAppClient, <any>'removeAccountsForPeers')
      .resolves()

    await initClientWithMock(dAppClient)
    await dAppClient.removePeer(peer1)

    expect(transportRemovePeerStub.callCount).to.equal(1)
    expect(transportRemovePeerStub.firstCall.args[0]).to.equal(peer1)
    expect(removeAccountsForPeersStub.callCount).to.equal(1)
    expect(removeAccountsForPeersStub.firstCall.args[0]).to.deep.equal([peer1])
  })

  it(`should remove all peers and all their accounts`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const transportGetPeerStub = sinon.stub(P2PTransport.prototype, 'getPeers').resolves([peer1])
    const transportRemoveAllPeersStub = sinon
      .stub(P2PTransport.prototype, 'removeAllPeers')
      .resolves()
    const removeAccountsForPeersStub = sinon
      .stub(dAppClient, <any>'removeAccountsForPeers')
      .resolves()

    await initClientWithMock(dAppClient)
    await dAppClient.removeAllPeers()

    expect(transportGetPeerStub.callCount, 'transportGetPeerStub').to.equal(1)
    expect(transportRemoveAllPeersStub.callCount, 'transportRemoveAllPeersStub').to.equal(1)
    expect(removeAccountsForPeersStub.callCount, 'removeAccountsForPeersStub').to.equal(1)
    expect(
      removeAccountsForPeersStub.firstCall.args[0],
      'removeAccountsForPeersStub'
    ).to.deep.equal([peer1])
  })

  it(`should subscribe to an event`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const eventsStub = sinon.stub((<any>dAppClient).events, 'on').resolves()

    const cb = () => {}
    dAppClient.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, cb)

    expect(eventsStub.callCount).to.equal(1)
    expect(eventsStub.firstCall.args[0]).to.equal(BeaconEvent.ACTIVE_ACCOUNT_SET)
    expect(eventsStub.firstCall.args[1]).to.equal(cb)
  })

  it(`should throw an error when checking for permissions and no active account is set`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const eventsStub = sinon.stub((<any>dAppClient).events, 'emit').resolves()

    try {
      await dAppClient.checkPermissions(BeaconMessageType.OperationRequest)
      throw new Error('Should have failed')
    } catch (e) {
      expect(eventsStub.callCount).to.equal(2)
      expect(eventsStub.firstCall.args[0]).to.equal(BeaconEvent.ACTIVE_ACCOUNT_SET) // This is called in the constructor
      expect(eventsStub.firstCall.args[1]).to.equal(undefined)
      expect(eventsStub.secondCall.args[0]).to.equal(BeaconEvent.INTERNAL_ERROR)
      expect(eventsStub.secondCall.args[1]).to.equal('No active account set!')
      expect(e.message).to.equal('No active account set!')
    }
  })

  it(`should check permissions for a PermissionRequest`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const hasPermission = await dAppClient.checkPermissions(BeaconMessageType.PermissionRequest)

    expect(hasPermission).to.be.true
  })

  it(`should check permissions for an OperationRequest`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const getActiveAccountStub = sinon.stub(dAppClient, 'getActiveAccount')

    getActiveAccountStub.resolves({
      scopes: [PermissionScope.OPERATION_REQUEST, PermissionScope.SIGN]
    } as any)

    expect(await dAppClient.checkPermissions(BeaconMessageType.OperationRequest)).to.be.true

    getActiveAccountStub.resolves({
      scopes: [PermissionScope.SIGN]
    } as any)

    expect(await dAppClient.checkPermissions(BeaconMessageType.OperationRequest)).to.be.false
  })

  it(`should check permissions for a SignPayloadRequest`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const getActiveAccountStub = sinon.stub(dAppClient, 'getActiveAccount')

    getActiveAccountStub.resolves({
      scopes: [PermissionScope.SIGN]
    } as any)

    expect(await dAppClient.checkPermissions(BeaconMessageType.SignPayloadRequest)).to.be.true

    getActiveAccountStub.resolves({
      scopes: [PermissionScope.OPERATION_REQUEST]
    } as any)

    expect(await dAppClient.checkPermissions(BeaconMessageType.SignPayloadRequest)).to.be.false
  })

  it(`should check permissions for a BroadcastRequest`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const getActiveAccountStub = sinon.stub(dAppClient, 'getActiveAccount')

    getActiveAccountStub.resolves({
      scopes: []
    } as any)

    expect(await dAppClient.checkPermissions(BeaconMessageType.BroadcastRequest)).to.be.true
  })

  it(`should prepare a permission request`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const permissionResponse: PermissionResponse = {
      id: 'my-id',
      type: BeaconMessageType.PermissionResponse,
      version: BEACON_VERSION,
      senderId: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3',
      publicKey: '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1',
      network: { type: NetworkType.MAINNET },
      scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST]
    }

    const connectionInfo: ConnectionContext = {
      origin: Origin.P2P,
      id: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3'
    }
    const makeRequestStub = sinon
      .stub(dAppClient, <any>'makeRequest')
      .resolves({ message: permissionResponse, connectionInfo })

    const response = await dAppClient.requestPermissions()

    expect(makeRequestStub.callCount).to.equal(1)
    expect(makeRequestStub.firstCall.args[0]).to.deep.equal({
      appMetadata: {
        icon: undefined,
        name: 'Test',
        senderId: await dAppClient.beaconId
      },
      type: BeaconMessageType.PermissionRequest,
      network: { type: 'mainnet' },
      scopes: ['operation_request', 'sign']
    })
    expect(response).to.deep.equal({
      senderId: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3',
      address: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7',
      network: { type: 'mainnet' },
      scopes: ['sign', 'operation_request'],
      publicKey: '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1',
      threshold: undefined
    })
  })

  it(`should prepare a sign payload request`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const account: AccountInfo = {
      accountIdentifier: 'yQxM85PrJ718CA1N6oz',
      senderId: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3',
      origin: {
        type: Origin.P2P,
        id: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3'
      },
      address: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7',
      publicKey: '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1',
      network: { type: NetworkType.MAINNET },
      scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST],
      threshold: undefined,
      connectedAt: 1599142450653
    }

    await (<any>dAppClient).accountManager.addAccount(account)
    await dAppClient.setActiveAccount(account)

    const signPayloadResponse: SignPayloadResponse = {
      id: 'my-id',
      type: BeaconMessageType.SignPayloadResponse,
      version: BEACON_VERSION,
      senderId: 'sender-id',
      signature: 'my-signature'
    }

    const connectionInfo: ConnectionContext = {
      origin: Origin.P2P,
      id: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3'
    }
    const makeRequestStub = sinon
      .stub(dAppClient, <any>'makeRequest')
      .resolves({ message: signPayloadResponse, connectionInfo })

    const response = await dAppClient.requestSignPayload({ payload: 'test-payload' })

    expect(makeRequestStub.callCount).to.equal(1)
    expect(makeRequestStub.firstCall.args[0]).to.deep.equal({
      type: BeaconMessageType.SignPayloadRequest,
      payload: 'test-payload',
      sourceAddress: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7'
    })
    expect(response).to.deep.equal({
      senderId: 'sender-id',
      signature: 'my-signature'
    })
  })

  it(`should prepare an operation request`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const account: AccountInfo = {
      accountIdentifier: 'yQxM85PrJ718CA1N6oz',
      senderId: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3',
      origin: {
        type: Origin.P2P,
        id: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3'
      },
      address: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7',
      publicKey: '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1',
      network: { type: NetworkType.MAINNET },
      scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST],
      threshold: undefined,
      connectedAt: 1599142450653
    }

    await (<any>dAppClient).accountManager.addAccount(account)
    await dAppClient.setActiveAccount(account)

    const operationResponse: OperationResponse = {
      id: 'my-id',
      type: BeaconMessageType.OperationResponse,
      version: BEACON_VERSION,
      senderId: 'sender-id',
      transactionHash: 'my-hash'
    }

    const connectionInfo: ConnectionContext = {
      origin: Origin.P2P,
      id: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3'
    }
    const makeRequestStub = sinon
      .stub(dAppClient, <any>'makeRequest')
      .resolves({ message: operationResponse, connectionInfo })

    const operationDetails: PartialTezosOperation[] = [
      {
        kind: TezosOperationType.TRANSACTION,
        amount: '1',
        destination: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7'
      }
    ]
    const response = await dAppClient.requestOperation({ operationDetails })

    expect(makeRequestStub.callCount).to.equal(1)
    expect(makeRequestStub.firstCall.args[0]).to.deep.equal({
      type: BeaconMessageType.OperationRequest,
      network: { type: NetworkType.MAINNET },
      operationDetails: operationDetails,
      sourceAddress: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7'
    })
    expect(response).to.deep.equal({
      senderId: 'sender-id',
      transactionHash: 'my-hash'
    })
  })

  it(`should prepare a broadcast request`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const account: AccountInfo = {
      accountIdentifier: 'yQxM85PrJ718CA1N6oz',
      senderId: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3',
      origin: {
        type: Origin.P2P,
        id: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3'
      },
      address: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7',
      publicKey: '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1',
      network: { type: NetworkType.MAINNET },
      scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST],
      threshold: undefined,
      connectedAt: 1599142450653
    }

    await (<any>dAppClient).accountManager.addAccount(account)
    await dAppClient.setActiveAccount(account)

    const broadcastResponse: BroadcastResponse = {
      id: 'my-id',
      type: BeaconMessageType.BroadcastResponse,
      version: BEACON_VERSION,
      senderId: 'sender-id',
      transactionHash: 'my-hash'
    }

    const connectionInfo: ConnectionContext = {
      origin: Origin.P2P,
      id: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3'
    }
    const makeRequestStub = sinon
      .stub(dAppClient, <any>'makeRequest')
      .resolves({ message: broadcastResponse, connectionInfo })

    const response = await dAppClient.requestBroadcast({ signedTransaction: 'signed-tx' })

    expect(makeRequestStub.callCount).to.equal(1)
    expect(makeRequestStub.firstCall.args[0]).to.deep.equal({
      type: BeaconMessageType.BroadcastRequest,
      network: { type: NetworkType.MAINNET },
      signedTransaction: 'signed-tx'
    })
    expect(response).to.deep.equal({
      senderId: 'sender-id',
      transactionHash: 'my-hash'
    })
  })

  it(`should send an internal error`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const eventsStub = sinon.stub((<any>dAppClient).events, 'emit').resolves()

    try {
      await (<any>dAppClient).sendInternalError('some-message')
      throw new Error('Should not happen')
    } catch (e) {
      expect(eventsStub.callCount).to.equal(2)
      expect(eventsStub.firstCall.args[0]).to.equal(BeaconEvent.INTERNAL_ERROR)
      expect(eventsStub.firstCall.args[1]).to.equal('some-message')
      expect(e.message).to.equal('some-message')
    }
  })

  it(`should remove all accounts for peers (empty storage)`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const accountManagerGetAccountsSpy = sinon.spy(AccountManager.prototype, 'getAccounts')
    const accountManagerRemoveAccountsSpy = sinon.spy(AccountManager.prototype, 'removeAccounts')

    await initClientWithMock(dAppClient)
    await (<any>dAppClient).removeAccountsForPeers([peer1, peer2])

    expect(accountManagerGetAccountsSpy.callCount, 'accountManagerGetAccountsSpy').to.equal(1)
    expect(accountManagerRemoveAccountsSpy.callCount, 'accountManagerRemoveAccountsSpy').to.equal(1)
    expect(accountManagerRemoveAccountsSpy.firstCall.args[0].length).to.equal(0)
  })

  it(`should remove all accounts for peers (two accounts for 1 peer)`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const accountManagerGetAccountsStub = sinon
      .stub(AccountManager.prototype, 'getAccounts')
      .resolves([account1, account2])
    const accountManagerRemoveAccountsStub = sinon.stub(AccountManager.prototype, 'removeAccounts')

    await initClientWithMock(dAppClient)
    await (<any>dAppClient).removeAccountsForPeers([peer1, peer2])

    expect(accountManagerGetAccountsStub.callCount, 'accountManagerGetAccountsStub').to.equal(1)
    expect(accountManagerRemoveAccountsStub.callCount, 'accountManagerRemoveAccountsStub').to.equal(
      1
    )
    expect(accountManagerRemoveAccountsStub.firstCall.args[0].length).to.equal(2)
    expect(accountManagerRemoveAccountsStub.firstCall.args[0][0]).to.equal('a1')
    expect(accountManagerRemoveAccountsStub.firstCall.args[0][1]).to.equal('a2')
  })

  it(`should handle request errors (case: beacon error)`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const eventsStub = sinon.stub((<any>dAppClient).events, 'emit').resolves()

    const request = {
      type: BeaconMessageType.PermissionRequest
    }
    const error = {
      errorType: BeaconErrorType.NOT_GRANTED_ERROR
    }

    try {
      await (<any>dAppClient).handleRequestError(request, error)
      throw new Error('Should not happen')
    } catch (e) {
      expect(eventsStub.callCount).to.equal(1)
      expect(eventsStub.firstCall.args[0]).to.equal(BeaconEvent.PERMISSION_REQUEST_ERROR)
      expect(eventsStub.firstCall.args[1]).to.equal(error)
      expect(e.description).to.equal(
        'You do not have the necessary permissions to perform this action. Please initiate another permission request and give the necessary permissions.'
      )
    }
  })

  it(`should handle request errors (case: not beacon error)`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const eventsStub = sinon.stub((<any>dAppClient).events, 'emit').resolves()

    const request = {
      type: BeaconMessageType.PermissionRequest
    }
    const error = {}

    try {
      await (<any>dAppClient).handleRequestError(request, error)
      throw new Error('Should not happen')
    } catch (e) {
      expect(eventsStub.callCount).to.equal(0)
      expect(e).to.equal(error)
    }
  })

  it(`should send notifications on success`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const eventsStub = sinon.stub((<any>dAppClient).events, 'emit').resolves()

    const request = { type: BeaconMessageType.PermissionRequest }
    const response = {}

    await (<any>dAppClient).notifySuccess(request, response)
    expect(eventsStub.callCount).to.equal(1)
    expect(eventsStub.firstCall.args[0]).to.equal(BeaconEvent.PERMISSION_REQUEST_SUCCESS)
    expect(eventsStub.firstCall.args[1]).to.equal(response)
  })

  it(`should create a request`, async () => {
    return new Promise(async (resolve, _reject) => {
      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })
      const sendStub = sinon.stub(P2PTransport.prototype, 'send').resolves()

      await initClientWithMock(dAppClient)

      const initStub = sinon.stub(dAppClient, 'init').resolves()
      const connectStub = sinon.stub(dAppClient, 'connect').resolves()
      const rateLimitStub = sinon
        .stub(dAppClient, 'addRequestAndCheckIfRateLimited')
        .resolves(false)
      const permissionStub = sinon.stub(dAppClient, 'checkPermissions').resolves(true)
      const addRequestStub = sinon.stub(dAppClient, <any>'addOpenRequest').resolves()
      const eventsStub = sinon.stub((<any>dAppClient).events, 'emit').resolves()

      const input = {
        type: BeaconMessageType.PermissionRequest
      }

      const promise: Promise<any> = (<any>dAppClient).makeRequest(input)

      setTimeout(async () => {
        expect(initStub.callCount, 'initStub').to.equal(1)
        expect(connectStub.callCount, 'connectStub').to.equal(1)
        expect(rateLimitStub.callCount, 'rateLimitStub').to.equal(1)
        expect(permissionStub.callCount, 'permissionStub').to.equal(1)
        expect(addRequestStub.callCount, 'addRequestStub').to.equal(1)
        expect(typeof addRequestStub.firstCall.args[0], 'addRequestStub').to.equal('string')
        expect(addRequestStub.firstCall.args[1].isPending(), 'addRequestStub').to.be.true
        expect(sendStub.callCount, 'sendStub').to.equal(1)
        expect(sendStub.firstCall.args[0], 'sendStub').to.include('DCRuaGjGFX')
        expect(sendStub.firstCall.args[1], 'sendStub').to.be.undefined
        expect(eventsStub.callCount, 'eventsStub').to.equal(1)
        expect(typeof promise).to.equal('object')

        resolve()
      })
    })
  })

  it(`should store an open request`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const promise = new ExposedPromise()

    await (<any>dAppClient).addOpenRequest('my-id', promise)

    expect((<any>dAppClient).openRequests.size).to.equal(1)
    expect((<any>dAppClient).openRequests.get('my-id')).to.equal(promise)
  })

  it(`should store an open request and handle a response`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const promise = new ExposedPromise()

    await (<any>dAppClient).addOpenRequest('my-id', promise)

    expect((<any>dAppClient).openRequests.size).to.equal(1)
    expect((<any>dAppClient).openRequests.get('my-id')).to.equal(promise)

    const message = { id: 'my-id' }
    const connectionInfo = {}

    await (<any>dAppClient).handleResponse(message, connectionInfo)

    expect(promise.isResolved()).to.be.true
    expect(promise.promiseResult).to.deep.equal({ message, connectionInfo })
    expect((<any>dAppClient).openRequests.size).to.equal(0)
  })

  it(`should store an open request and handle an error response`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const promise = new ExposedPromise()
    promise.promise.catch(() => null)

    await (<any>dAppClient).addOpenRequest('my-id', promise)

    expect((<any>dAppClient).openRequests.size).to.equal(1)
    expect((<any>dAppClient).openRequests.get('my-id')).to.equal(promise)

    const message = { type: BeaconMessageType.Error, id: 'my-id' }
    const connectionInfo = {}

    await (<any>dAppClient).handleResponse(message, connectionInfo)

    expect(promise.isRejected()).to.be.true
    expect(promise.promiseError).to.deep.equal(message)
    expect((<any>dAppClient).openRequests.size).to.equal(0)
  })

  it(`should not handle a response if the id is unknown`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })
    const logStub = sinon.stub(Logger.prototype, 'error').resolves()

    const message = { id: 'my-id' }
    const connectionInfo = {}

    await (<any>dAppClient).handleResponse(message, connectionInfo)

    expect(logStub.callCount).to.equal(1)
  })

  it(`should handle a disconnect message`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const eventsStub = sinon.stub((<any>dAppClient).events, 'emit').resolves()
    const transportRemovePeerStub = sinon.stub(P2PTransport.prototype, 'removePeer').resolves()

    const message = { type: BeaconMessageType.Disconnect, id: 'my-id', senderId: 'sender-id' }
    const connectionInfo = {}

    await initClientWithMock(dAppClient)

    await (<any>dAppClient).handleResponse(message, connectionInfo)

    expect(transportRemovePeerStub.callCount, 'transportRemovePeerStub').to.equal(1)
    expect(transportRemovePeerStub.firstCall.args[0]).to.deep.equal({
      name: '',
      publicKey: 'sender-id',
      version: BEACON_VERSION,
      relayServer: ''
    })
    expect(eventsStub.callCount, 'eventsStub').to.equal(3)
    expect(eventsStub.thirdCall.args[0]).to.equal(BeaconEvent.P2P_CHANNEL_CLOSED)
  })
})
