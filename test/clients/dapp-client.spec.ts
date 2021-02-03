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
  PartialTezosOperation,
  SigningType,
  PermissionResponse,
  PermissionScope,
  SignPayloadResponse,
  StorageKey,
  TezosOperationType,
  TransportStatus,
  PostMessageTransport,
  DappPostMessageTransport,
  DappP2PTransport,
  getSenderId,
  Transport,
  ExtendedP2PPairingRequest
} from '../../src'

import { MockTransport } from '../test-utils/MockTransport'
import { availableTransports } from '../../src/utils/available-transports'
import { ExposedPromise } from '../../src/utils/exposed-promise'
import { Logger } from '../../src/utils/Logger'
import { windowRef } from '../../src/MockWindow'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const peer1: ExtendedP2PPairingRequest = {
  id: 'id1',
  type: 'p2p-pairing-request',
  name: 'test',
  version: BEACON_VERSION,
  publicKey: 'my-public-key',
  senderId: 'sender1',
  relayServer: 'test-relay.walletbeacon.io'
}

const peer2: ExtendedP2PPairingRequest = {
  id: 'id2',
  type: 'p2p-pairing-request',
  name: 'test',
  version: BEACON_VERSION,
  publicKey: 'my-public-key-2',
  senderId: 'sender2',
  relayServer: 'test-relay.walletbeacon.io'
}

const account1: AccountInfo = {
  accountIdentifier: 'a1',
  senderId: 'sender1',
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
  senderId: 'sender2',
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
 * @param client DAppClient
 */
const initClientWithMock = async (client: DAppClient) => {
  const extensionRef = availableTransports.extension
  availableTransports.extension = Promise.resolve(false)

  const transport = new MockTransport('TestTransport', undefined as any, undefined as any)
  await client.init(transport)

  availableTransports.extension = extensionRef
}

describe(`DAppClient`, () => {
  before(function () {
    /**
     * This is used to mock the window object
     *
     * We cannot do it globally because it fails in the storage tests because of security policies
     */
    this.jsdom = require('jsdom-global')('<!doctype html><html><body></body></html>', {
      url: 'http://localhost/'
    })
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
    ;(windowRef as any).beaconCreatedClientInstance = false
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
      appMetadata: {
        senderId: 'sender-id',
        name: 'test-wallet'
      },
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

    expect(storageStub.callCount).to.equal(3)
    expect(storageStub.firstCall.args[0]).to.equal(StorageKey.BEACON_SDK_SECRET_SEED)
    expect(storageStub.secondCall.args[0]).to.equal(StorageKey.ACTIVE_ACCOUNT)
    expect(storageStub.thirdCall.args[0]).to.equal(StorageKey.ACTIVE_PEER)
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

      const transport = new MockTransport('TestTransport', undefined as any, undefined as any)
      await dAppClient.init(transport)
      await dAppClient.ready

      clearTimeout(timeout)
      expect(await dAppClient.connectionStatus).to.equal(TransportStatus.NOT_CONNECTED)
      expect(await (dAppClient as any).transport).to.equal(transport)
      resolve()
    })
  })

  it(`should reconnect`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const storage = new LocalStorage()
      await storage.set(
        StorageKey.ACTIVE_PEER,
        '48d79c808e9c6adcef4343fee74599ac7f3c766be6798143235c8cb939acf19f'
      )
      await storage.set(StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP, [
        {
          id: 'c21fcf96-53d5-c30c-0cf1-7105e046b8ac',
          type: 'postmessage-pairing-response',
          name: 'Spire',
          version: '2',
          publicKey: '48d79c808e9c6adcef4343fee74599ac7f3c766be6798143235c8cb939acf19f',
          senderId: '2CnDdXvxhEC9d',
          extensionId: 'pmaikkbanoioekgijdjfmaifipnbmgmc'
        }
      ] as any)

      const dAppClient = new DAppClient({ name: 'Test', storage: storage })

      await dAppClient.init()
      await dAppClient.ready

      await storage.delete(StorageKey.ACTIVE_PEER)
      await storage.delete(StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP)

      clearTimeout(timeout)
      expect(await dAppClient.connectionStatus).to.equal(TransportStatus.CONNECTED)
      resolve()
    })
  })

  it(`should listen for connections on P2P and PostMessage and wait`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        resolve()
      }, 100)

      sinon.stub(PostMessageTransport, 'getAvailableExtensions').resolves()

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      sinon.stub((<any>dAppClient).events, 'emit').resolves()

      await dAppClient.init()

      clearTimeout(timeout)
      reject(new Error('SHOULD NOT RESOLVE'))
    })
  })

  it(`should listen for connections on P2P and PostMessage`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const p2pConnectStub = sinon.stub(DappP2PTransport.prototype, 'connect').resolves()
      const postMessageConnectStub = sinon
        .stub(DappPostMessageTransport.prototype, 'connect')
        .resolves()

      const postMessageCallbackStub = sinon
        .stub(DappPostMessageTransport.prototype, 'listenForNewPeer')
        .callsArgWithAsync(0, peer1)
        .resolves()

      sinon.stub(PostMessageTransport, 'getAvailableExtensions').resolves()

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      const eventsStub = sinon.stub((<any>dAppClient).events, 'emit').resolves()

      await dAppClient.init()

      clearTimeout(timeout)
      expect(postMessageCallbackStub.callCount, 'postMessageCallbackStub').to.equal(1)
      expect(eventsStub.callCount, 'eventsStub').to.equal(5)
      const events = eventsStub.getCalls().map((call) => (<any>call).firstArg)
      expect(events, 'eventsStub').to.include('PAIR_INIT')
      expect(p2pConnectStub.callCount, 'p2pConnectStub').to.equal(1)
      expect(postMessageConnectStub.callCount, 'postMessageConnectStub').to.equal(1)
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

    const getPeersStub = sinon.stub(DAppClient.prototype, <any>'getPeer').resolves(peer1)

    await dAppClient.setActiveAccount(account1)

    activeAccount = await dAppClient.getActiveAccount()
    expect(activeAccount).to.deep.equal(account1)

    await dAppClient.setActiveAccount()

    activeAccount = await dAppClient.getActiveAccount()
    expect(activeAccount).to.be.undefined

    expect(getPeersStub.callCount, 'getPeersStub').to.equal(1)
  })

  it(`should get app metadata`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const metadata = await dAppClient.getAppMetadata()

    expect(metadata).to.deep.equal({
      senderId: await getSenderId(await dAppClient.beaconId),
      name: dAppClient.name,
      icon: dAppClient.iconUrl
    })
  })

  it(`should initialize`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      await dAppClient.init(new MockTransport('TestTransport', undefined as any, undefined as any))
      await dAppClient.ready

      clearTimeout(timeout)
      expect(await dAppClient.connectionStatus).to.equal(TransportStatus.NOT_CONNECTED)
      resolve()
    })
  })

  it(`should remove an account and unset active account`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const getPeersStub = sinon.stub(DAppClient.prototype, <any>'getPeer').resolves(peer1)

    await (<any>dAppClient).accountManager.addAccount(account1)
    await (<any>dAppClient).accountManager.addAccount(account2)
    await dAppClient.setActiveAccount(account1)

    expect(await dAppClient.getAccounts()).to.deep.equal([account1, account2])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(account1)

    await dAppClient.removeAccount(account1.accountIdentifier)

    expect(await dAppClient.getAccounts()).to.deep.equal([account2])
    expect(await dAppClient.getActiveAccount()).to.be.undefined

    expect(getPeersStub.callCount, 'getPeersStub').to.equal(1)
  })

  it(`should remove an account and not unset active account`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const getPeersStub = sinon.stub(DAppClient.prototype, <any>'getPeer').resolves(peer1)

    await (<any>dAppClient).accountManager.addAccount(account1)
    await (<any>dAppClient).accountManager.addAccount(account2)
    await dAppClient.setActiveAccount(account1)

    expect(await dAppClient.getAccounts()).to.deep.equal([account1, account2])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(account1)

    await dAppClient.removeAccount(account2.accountIdentifier)

    expect(await dAppClient.getAccounts()).to.deep.equal([account1])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(account1)

    expect(getPeersStub.callCount, 'getPeersStub').to.equal(1)
  })

  it(`should remove all accounts and unset active account`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const getPeersStub = sinon.stub(DAppClient.prototype, <any>'getPeer').resolves(peer1)

    await (<any>dAppClient).accountManager.addAccount(account1)
    await (<any>dAppClient).accountManager.addAccount(account2)
    await dAppClient.setActiveAccount(account1)

    expect(await dAppClient.getAccounts()).to.deep.equal([account1, account2])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(account1)

    await dAppClient.removeAllAccounts()

    expect(await dAppClient.getAccounts()).to.deep.equal([])
    expect(await dAppClient.getActiveAccount()).to.deep.equal(undefined)

    expect(getPeersStub.callCount, 'getPeersStub').to.equal(1)
  })

  it(`should remove peer and all its accounts`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const transportRemovePeerStub = sinon.stub(Transport.prototype, 'removePeer').resolves()
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

    const transportGetPeerStub = sinon.stub(Transport.prototype, 'getPeers').resolves([peer1])
    const transportRemoveAllPeersStub = sinon.stub(Transport.prototype, 'removeAllPeers').resolves()
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
      expect(eventsStub.firstCall.args[0]).to.equal(BeaconEvent.ACTIVE_TRANSPORT_SET) // Called in the constructor
      expect(eventsStub.firstCall.args[1]).to.equal(undefined)
      expect(eventsStub.secondCall.args[0]).to.equal(BeaconEvent.INTERNAL_ERROR)
      expect(eventsStub.secondCall.args[1]).to.equal('No active account set!')
      // expect(eventsStub.thirdCall.args[0]).to.equal(BeaconEvent.ACTIVE_ACCOUNT_SET) // Called in the constructor
      // expect(eventsStub.thirdCall.args[1]).to.equal(undefined)
      expect(eventsStub.callCount).to.equal(2)
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
      appMetadata: {
        senderId: 'sender-id',
        name: 'test-wallet'
      },
      id: 'my-id',
      type: BeaconMessageType.PermissionResponse,
      version: BEACON_VERSION,
      senderId: 'sender-id',
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

    const notifySuccessStub = sinon.stub(dAppClient, <any>'notifySuccess').resolves()

    const getPeersStub = sinon.stub(Transport.prototype, 'getPeers').resolves([
      {
        id: '',
        name: '',
        publicKey: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3',
        senderId: 'sender-id',
        version: BEACON_VERSION,
        type: 'p2p-pairing-request',
        relayServer: ''
      }
    ])

    const response = await dAppClient.requestPermissions()

    expect(getPeersStub.callCount, 'getPeersStub').to.equal(4)
    expect(notifySuccessStub.callCount, 'notifySuccessStub').to.equal(1)
    expect(makeRequestStub.callCount).to.equal(1)
    expect(makeRequestStub.firstCall.args[0]).to.deep.equal({
      appMetadata: {
        icon: undefined,
        name: 'Test',
        senderId: await getSenderId(await dAppClient.beaconId)
      },
      type: BeaconMessageType.PermissionRequest,
      network: { type: 'mainnet' },
      scopes: ['operation_request', 'sign']
    })
    delete response.accountInfo
    expect(response).to.deep.equal({
      appMetadata: {
        senderId: 'sender-id',
        name: 'test-wallet'
      },
      id: 'my-id',
      type: BeaconMessageType.PermissionResponse,
      senderId: 'sender-id',
      address: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7',
      network: { type: 'mainnet' },
      scopes: ['sign', 'operation_request'],
      publicKey: '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1',
      version: '2'
    })
  })

  it(`should prepare a sign payload request (RAW)`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const account: AccountInfo = {
      accountIdentifier: 'yQxM85PrJ718CA1N6oz',
      senderId: 'sender-id',
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

    const getPeerStub = sinon.stub(DAppClient.prototype, <any>'getPeer').resolves(peer1)

    await (<any>dAppClient).accountManager.addAccount(account)
    await dAppClient.setActiveAccount(account)

    const signPayloadResponse: SignPayloadResponse = {
      id: 'my-id',
      type: BeaconMessageType.SignPayloadResponse,
      version: BEACON_VERSION,
      senderId: 'sender-id',
      signingType: SigningType.RAW,
      signature: 'my-signature'
    }

    const connectionInfo: ConnectionContext = {
      origin: Origin.P2P,
      id: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3'
    }
    const makeRequestStub = sinon
      .stub(dAppClient, <any>'makeRequest')
      .resolves({ message: signPayloadResponse, connectionInfo })

    const notifySuccessStub = sinon.stub(dAppClient, <any>'notifySuccess').resolves()

    const response = await dAppClient.requestSignPayload({ payload: 'test-payload' })

    expect(getPeerStub.callCount, 'getPeersStub').to.equal(2)
    expect(notifySuccessStub.callCount, 'notifySuccessStub').to.equal(1)
    expect(makeRequestStub.callCount).to.equal(1)
    expect(makeRequestStub.firstCall.args[0]).to.deep.equal({
      type: BeaconMessageType.SignPayloadRequest,
      payload: 'test-payload',
      signingType: SigningType.RAW,
      sourceAddress: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7'
    })

    const expectedResponse = {
      id: 'my-id',
      senderId: 'sender-id',
      signingType: SigningType.RAW,
      signature: 'my-signature',
      type: BeaconMessageType.SignPayloadResponse,
      version: '2'
    }

    expect(response).to.deep.equal(expectedResponse)

    const responseOperation = await dAppClient.requestSignPayload({
      signingType: SigningType.OPERATION,
      payload: '03test-payload'
    })
    expect(responseOperation).to.deep.equal(expectedResponse)

    try {
      const responseFailure = await dAppClient.requestSignPayload({
        signingType: SigningType.OPERATION,
        payload: 'test-payload'
      })
      throw new Error('should not get here' + responseFailure)
    } catch (e) {
      expect(e.message).to.equal(
        `When using singing type "OPERATION", the payload must start with prefix "03"`
      )
    }

    const responseMicheline = await dAppClient.requestSignPayload({
      signingType: SigningType.MICHELINE,
      payload: '05test-payload'
    })
    expect(responseMicheline).to.deep.equal(expectedResponse)

    try {
      const responseFailure = await dAppClient.requestSignPayload({
        signingType: SigningType.MICHELINE,
        payload: 'test-payload'
      })
      throw new Error('should not get here' + responseFailure)
    } catch (e) {
      expect(e.message).to.equal(
        `When using singing type "MICHELINE", the payload must start with prefix "05"`
      )
    }
  })

  it(`should prepare an operation request`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const account: AccountInfo = {
      accountIdentifier: 'yQxM85PrJ718CA1N6oz',
      senderId: 'sender-id',
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

    const getPeerStub = sinon.stub(DAppClient.prototype, <any>'getPeer').resolves(peer1)

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

    const notifySuccessStub = sinon.stub(dAppClient, <any>'notifySuccess').resolves()

    const operationDetails: PartialTezosOperation[] = [
      {
        kind: TezosOperationType.TRANSACTION,
        amount: '1',
        destination: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7'
      }
    ]
    const response = await dAppClient.requestOperation({ operationDetails })

    expect(getPeerStub.callCount, 'getPeersStub').to.equal(2)
    expect(notifySuccessStub.callCount, 'notifySuccessStub').to.equal(1)
    expect(makeRequestStub.callCount).to.equal(1)
    expect(makeRequestStub.firstCall.args[0]).to.deep.equal({
      type: BeaconMessageType.OperationRequest,
      network: { type: NetworkType.MAINNET },
      operationDetails: operationDetails,
      sourceAddress: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7'
    })
    expect(response).to.deep.equal({
      id: 'my-id',
      senderId: 'sender-id',
      transactionHash: 'my-hash',
      type: BeaconMessageType.OperationResponse,
      version: '2'
    })
  })

  it(`should prepare a broadcast request`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const account: AccountInfo = {
      accountIdentifier: 'yQxM85PrJ718CA1N6oz',
      senderId: 'sender-id',
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

    const getPeerStub = sinon.stub(DAppClient.prototype, <any>'getPeer').resolves(peer1)

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

    const notifySuccessStub = sinon.stub(dAppClient, <any>'notifySuccess').resolves()

    const response = await dAppClient.requestBroadcast({ signedTransaction: 'signed-tx' })

    expect(getPeerStub.callCount, 'getPeersStub').to.equal(2)
    expect(notifySuccessStub.callCount, 'notifySuccessStub').to.equal(1)
    expect(makeRequestStub.callCount).to.equal(1)
    expect(makeRequestStub.firstCall.args[0]).to.deep.equal({
      type: BeaconMessageType.BroadcastRequest,
      network: { type: NetworkType.MAINNET },
      signedTransaction: 'signed-tx'
    })
    expect(response).to.deep.equal({
      id: 'my-id',
      senderId: 'sender-id',
      transactionHash: 'my-hash',
      type: BeaconMessageType.BroadcastResponse,
      version: '2'
    })
  })

  it(`should send an internal error`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

    const eventsStub = sinon.stub((<any>dAppClient).events, 'emit').resolves()

    try {
      await (<any>dAppClient).sendInternalError('some-message')
      throw new Error('Should not happen')
    } catch (e) {
      expect(eventsStub.callCount).to.equal(1)
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

    const walletInfoStub = sinon.stub(dAppClient, <any>'getWalletInfo').resolves({})

    ;(<any>dAppClient)._activePeer = ExposedPromise.resolve({
      id: '',
      name: '',
      publicKey: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3',
      senderId: 'sender-id',
      version: BEACON_VERSION,
      type: 'p2p-pairing-request',
      relayServer: ''
    })

    try {
      await (<any>dAppClient).handleRequestError(request, error)
      throw new Error('Should not happen')
    } catch (e) {
      expect(walletInfoStub.callCount, 'walletInfoStub').to.equal(1)

      expect(eventsStub.callCount).to.equal(3)
      expect(eventsStub.getCall(0).args[0]).to.equal(BeaconEvent.ACTIVE_TRANSPORT_SET)
      expect(eventsStub.getCall(0).args[1]).to.equal(undefined)
      expect(eventsStub.getCall(1).args[0]).to.equal(BeaconEvent.PERMISSION_REQUEST_ERROR)
      expect(eventsStub.getCall(1).args[1]).to.deep.eq({ errorResponse: error, walletInfo: {} })
      expect(eventsStub.getCall(2).args[0]).to.equal(BeaconEvent.ACTIVE_ACCOUNT_SET)
      expect(eventsStub.getCall(2).args[1]).to.equal(undefined)
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
      const sendStub = sinon.stub(Transport.prototype, 'send').resolves()

      const getPeerStub = sinon.stub(DAppClient.prototype, <any>'getPeer').resolves(peer1)

      await initClientWithMock(dAppClient)

      const initStub = sinon.stub(dAppClient, 'init').resolves()
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
        expect(getPeerStub.callCount, 'getPeersStub').to.equal(1)

        expect(initStub.callCount, 'initStub').to.equal(1)
        expect(rateLimitStub.callCount, 'rateLimitStub').to.equal(1)
        expect(permissionStub.callCount, 'permissionStub').to.equal(1)
        expect(addRequestStub.callCount, 'addRequestStub').to.equal(1)
        expect(typeof addRequestStub.firstCall.args[0], 'addRequestStub').to.equal('string')
        expect(addRequestStub.firstCall.args[1].isPending(), 'addRequestStub').to.be.true
        expect(sendStub.callCount, 'sendStub').to.equal(1)
        expect(sendStub.firstCall.args[0].length, 'sendStub').to.be.greaterThan(20)
        expect(sendStub.firstCall.args[1], 'sendStub').to.equal(peer1)
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
    const transportRemovePeerStub = sinon.stub(Transport.prototype, 'removePeer').resolves()
    const getPeersStub = sinon.stub(Transport.prototype, 'getPeers').resolves([
      {
        id: '',
        name: '',
        publicKey: 'sender-id',
        senderId: 'sender-id',
        version: BEACON_VERSION,
        type: 'p2p-pairing-request',
        relayServer: ''
      }
    ])

    const message = { type: BeaconMessageType.Disconnect, id: 'my-id', senderId: 'sender-id' }
    const connectionInfo = {}

    await initClientWithMock(dAppClient)

    await (<any>dAppClient).handleResponse(message, connectionInfo)

    expect(getPeersStub.callCount, 'getPeersStub').to.equal(1)
    expect(transportRemovePeerStub.callCount, 'transportRemovePeerStub').to.equal(1)
    expect(transportRemovePeerStub.firstCall.args[0]).to.deep.equal({
      id: '',
      name: '',
      publicKey: 'sender-id',
      senderId: 'sender-id',
      version: BEACON_VERSION,
      type: 'p2p-pairing-request',
      relayServer: ''
    })

    expect(eventsStub.callCount, 'eventsStub').to.equal(4)
    expect(eventsStub.getCall(0).args[0], '1').to.equal(BeaconEvent.ACTIVE_TRANSPORT_SET)
    expect(eventsStub.getCall(1).args[0], '2').to.equal(BeaconEvent.ACTIVE_ACCOUNT_SET)
    expect(eventsStub.getCall(2).args[0], '3').to.equal(BeaconEvent.ACTIVE_TRANSPORT_SET)
    expect(eventsStub.getCall(3).args[0], '4').to.equal(BeaconEvent.CHANNEL_CLOSED)
  })
})
