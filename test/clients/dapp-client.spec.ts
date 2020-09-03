import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import {
  AccountInfo,
  BeaconEvent,
  BeaconMessageType,
  BEACON_VERSION,
  ConnectionContext,
  DAppClient,
  LocalStorage,
  NetworkType,
  Origin,
  PermissionResponse,
  PermissionScope,
  StorageKey,
  TransportType
} from '../../src'

import { MockTransport } from '../test-utils/MockTransport'
import { availableTransports } from '../../src/utils/available-transports'
// import { myWindow } from '../../src/MockWindow'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

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

  it.skip(`should remove an account and unset active account`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove an account and not unset active account`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove peer and all its accounts`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove all peers and all their accounts`, async () => {
    expect(true).to.be.false
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

  it.skip(`should prepare a permission request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should prepare a sign payload request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should prepare an operation request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should prepare a broadcast request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should send an internal error`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove all accounts for peers`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should handle request errors`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should send notifications on success`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should create a request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should store an open request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should store an open request and handle a response`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should not handle a response if the id is unknown`, async () => {
    expect(true).to.be.false
  })
})
