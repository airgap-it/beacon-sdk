import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import {
  BeaconErrorType,
  BeaconMessageType,
  ConnectionContext,
  NetworkType,
  Origin,
  PermissionScope,
  ExtendedP2PPairingRequest,
  PermissionRequest,
  PermissionInfo,
  PermissionResponseInput,
  BeaconResponseInputMessage
} from '@mavrykdynamics/beacon-types'

import {
  AppMetadataManager,
  PermissionManager,
  windowRef,
  BEACON_VERSION,
  LocalStorage,
  getSenderId,
  Serializer
} from '@mavrykdynamics/beacon-core'

import { P2PTransport } from '@mavrykdynamics/beacon-transport-matrix'
import { WalletClient } from '../src'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const pubkey1 = 'c126ba9a0217756c4d3540ba15aaa01e0edcb7c917d66f64db20b1dae8296ddd'
const senderId1 = 'NMPgABdfdvBE'
const pubkey2 = '04be24648e1b753cbfc6cb46aa12f8f2469f9cdf3b414a33ebcb807912d43447'
const senderId2 = 'QwMX82A3vQwX'

const peer1: ExtendedP2PPairingRequest = {
  id: 'id1',
  type: 'p2p-pairing-request',
  name: 'test',
  senderId: senderId1,
  version: BEACON_VERSION,
  publicKey: pubkey1,
  relayServer: 'test-relay.walletbeacon.io'
}

const peer2: ExtendedP2PPairingRequest = {
  id: 'id2',
  type: 'p2p-pairing-request',
  name: 'test',
  senderId: senderId2,
  version: BEACON_VERSION,
  publicKey: pubkey2,
  relayServer: 'test-relay.walletbeacon.io'
}

describe(`WalletClient`, () => {
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
      const walletClient = new WalletClient({} as any)
      expect(walletClient).to.be.undefined
    } catch (e) {
      expect((e as any).message).to.equal('Name not set')
    }
  })

  it(`should initialize without an error`, async () => {
    const walletClient = new WalletClient({ name: 'Test' })
    expect(walletClient).to.not.be.undefined
  })

  it(`should have a beacon ID`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })
    expect(typeof (await walletClient.beaconId)).to.equal('string')
  })

  it(`should connect and register the callback and receive a callback`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })

    const connectStub = sinon.stub(P2PTransport.prototype, 'connect').resolves()
    const addListenerStub = sinon.stub(P2PTransport.prototype, 'addListener').resolves()

    const callback = sinon.fake()

    await walletClient.init()
    await walletClient.connect(callback)

    expect(typeof (<any>walletClient).handleResponse).to.equal('function')
    expect(connectStub.callCount).to.equal(1)
    expect(addListenerStub.callCount).to.equal(1)
    expect(callback.callCount).to.equal(0)

    const message: PermissionRequest = {
      id: 'some-id',
      version: BEACON_VERSION,
      senderId: 'sender-id',
      type: BeaconMessageType.PermissionRequest,
      appMetadata: { name: 'test', senderId: 'sender-id-2' },
      network: { type: NetworkType.MAINNET },
      scopes: []
    }
    const contextInfo: ConnectionContext = {
      origin: Origin.P2P,
      id: 'some-id'
    }

    await (<any>walletClient).handleResponse(message, contextInfo)

    expect(callback.callCount).to.equal(1)
    expect(callback.firstCall.args[0]).to.equal(message)
    expect(callback.firstCall.args[1]).to.equal(contextInfo)
  })

  it(`should not respond to a message if matching request is not found`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })

    const id = 'some-id'
    const message: PermissionResponseInput = {
      id,
      type: BeaconMessageType.PermissionResponse,
      network: { type: NetworkType.MAINNET },
      scopes: [],
      publicKey: 'public-key'
    }

    try {
      await walletClient.respond(message)
      throw new Error('Should not work!')
    } catch (error) {
      expect((error as any).message).to.equal('No matching request found!')
    }
  })

  it(`should respond to a message if matching request is found`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })

    const id = 'some-id'
    const message: PermissionResponseInput = {
      id,
      type: BeaconMessageType.PermissionResponse,
      network: { type: NetworkType.MAINNET },
      scopes: [],
      publicKey: '69421294fd0136926639977666e8523550af4c126b6bcd429d3ae555c7aca3a3'
    }

    ;(<any>walletClient).pendingRequests.push([{ id }, {}])

    const respondStub = sinon.stub(walletClient, <any>'respondToMessage').resolves()
    const appMetadataManagerStub = sinon
      .stub(AppMetadataManager.prototype, 'getAppMetadata')
      .resolves({ name: 'my-test', senderId: 'my-sender-id' })

    await walletClient.respond(message)

    expect(appMetadataManagerStub.callCount).to.equal(1)
    expect(respondStub.callCount).to.equal(1)
    expect(respondStub.firstCall.args[0]).to.include(message)
  })

  it(`should remove a peer and all its permissions`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })
    const transportRemovePeerStub = sinon.stub(P2PTransport.prototype, 'removePeer').resolves()
    const removePermissionsForPeersStub = sinon
      .stub(walletClient, <any>'removePermissionsForPeers')
      .resolves()

    await walletClient.init()
    await walletClient.removePeer(peer1 as any)

    expect(transportRemovePeerStub.callCount).to.equal(1)
    expect(removePermissionsForPeersStub.callCount).to.equal(1)
  })

  it(`should remove all peers and all their permissions`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })
    const transportGetPeerStub = sinon.stub(P2PTransport.prototype, 'getPeers').resolves([])
    const transportRemoveAllPeersStub = sinon
      .stub(P2PTransport.prototype, 'removeAllPeers')
      .resolves()
    const removePermissionsForPeersStub = sinon
      .stub(walletClient, <any>'removePermissionsForPeers')
      .resolves()

    await walletClient.init()
    await walletClient.removeAllPeers()

    expect(transportGetPeerStub.callCount, 'transportGetPeerStub').to.equal(1)
    expect(transportRemoveAllPeersStub.callCount, 'transportRemoveAllPeersStub').to.equal(1)
    expect(removePermissionsForPeersStub.callCount, 'removePermissionsForPeersStub').to.equal(1)
  })

  it(`should remove all permissions for peers (empty storage)`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })

    const permissionManagerGetPermissionsSpy = sinon.spy(
      PermissionManager.prototype,
      'getPermissions'
    )
    const permissionManagerRemovePermissionsSpy = sinon.spy(
      PermissionManager.prototype,
      'removePermissions'
    )

    await walletClient.init()
    await (<any>walletClient).removePermissionsForPeers([peer1, peer2])

    expect(
      permissionManagerGetPermissionsSpy.callCount,
      'permissionManagerGetPermissionsSpy'
    ).to.equal(1)
    expect(
      permissionManagerRemovePermissionsSpy.callCount,
      'permissionManagerRemovePermissionsSpy'
    ).to.equal(1)
    expect(permissionManagerRemovePermissionsSpy.firstCall.args[0].length).to.equal(0)
  })

  it(`should remove all permissions for peers (two accounts for 1 peer)`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })

    const permission1: PermissionInfo = {
      accountIdentifier: 'a1',
      senderId: await getSenderId(peer1.publicKey),
      appMetadata: { senderId: await getSenderId(peer1.publicKey), name: 'name1' },
      website: 'website1',
      address: 'tz1',
      publicKey: 'publicKey1',
      network: { type: NetworkType.MAINNET },
      scopes: [PermissionScope.SIGN],
      connectedAt: new Date().getTime()
    }
    const permission2: PermissionInfo = {
      accountIdentifier: 'a2',
      senderId: await getSenderId(peer1.publicKey),
      appMetadata: { senderId: await getSenderId(peer1.publicKey), name: 'name1' },
      website: 'website2',
      address: 'tz1',
      publicKey: 'publicKey2',
      network: { type: NetworkType.MAINNET },
      scopes: [PermissionScope.SIGN],
      connectedAt: new Date().getTime()
    }

    const permissionManagerGetPermissionsStub = sinon
      .stub(PermissionManager.prototype, 'getPermissions')
      .resolves([permission1, permission2])
    const permissionManagerRemovePermissionsStub = sinon.stub(
      PermissionManager.prototype,
      'removePermissions'
    )

    await walletClient.init()
    await (<any>walletClient).removePermissionsForPeers([peer1, peer2])

    expect(
      permissionManagerGetPermissionsStub.callCount,
      'permissionManagerGetPermissionsStub'
    ).to.equal(1)
    expect(
      permissionManagerRemovePermissionsStub.callCount,
      'permissionManagerRemovePermissionsStub'
    ).to.equal(1)
    expect(permissionManagerRemovePermissionsStub.firstCall.args[0].length).to.equal(2)
    expect(permissionManagerRemovePermissionsStub.firstCall.args[0][0]).to.equal('a1')
    expect(permissionManagerRemovePermissionsStub.firstCall.args[0][1]).to.equal('a2')
  })

  it(`should respond to a message`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })

    const serializerStub = sinon.stub(Serializer.prototype, 'serialize').resolves()
    // const sendStub = sinon.stub(P2PTransport.prototype, 'send').resolves()

    await walletClient.init()
    ;(<any>walletClient).respondToMessage({ test: 'message' })

    // TODO: Test if acknowledge message is sent

    expect(serializerStub.callCount).to.equal(1)
    expect(serializerStub.firstCall.args[0]).to.deep.equal({ test: 'message' })
    // expect(sendStub.callCount).to.equal(1)
    // expect(sendStub.firstCall.args[0]).to.equal('aRNACa2rFgw2dfAugetVZpzSbMdahH')
  })

  it(`should respond with an error message`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })

    const respondStub = sinon.stub(walletClient, <any>'respondToMessage').resolves()

    const id = '1234test'

    ;(<any>walletClient).pendingRequests.push([{ id }, {}])

    await walletClient.init()

    const message: BeaconResponseInputMessage = {
      id,
      type: BeaconMessageType.Error,
      errorType: BeaconErrorType.TRANSACTION_INVALID_ERROR,
      errorData: [
        {
          kind: 'temporary',
          id: 'proto.007-PsDELPH1.contract.non_existing_contract',
          contract: 'KT1RxKJyi48W3bZR8HErRiisXZQw19HwLGWj'
        }
      ]
    }

    await walletClient.respond(message)

    expect(respondStub.callCount).to.equal(1)
    expect(respondStub.firstCall.args[0]).to.include(message)
    expect(respondStub.firstCall.args[0].errorData).not.to.be.undefined
  })

  it(`should respond with an error message`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })

    const respondStub = sinon.stub(walletClient, <any>'respondToMessage').resolves()

    const id = '1234test'

    ;(<any>walletClient).pendingRequests.push([{ id }, {}])

    await walletClient.init()

    const message: BeaconResponseInputMessage = {
      id,
      type: BeaconMessageType.Error,
      errorType: BeaconErrorType.PARAMETERS_INVALID_ERROR,
      errorData: [
        {
          kind: 'temporary',
          id: 'proto.007-PsDELPH1.contract.non_existing_contract',
          contract: 'KT1RxKJyi48W3bZR8HErRiisXZQw19HwLGWj'
        }
      ]
    }

    await walletClient.respond(message)

    const { errorData, ...newMessage } = message

    expect(respondStub.callCount).to.equal(1)
    expect(respondStub.firstCall.args[0]).to.include(newMessage)
    expect(respondStub.firstCall.args[0].errorData).to.be.undefined
  })

  it(`should not respond with an invalid error message`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })

    const respondStub = sinon.stub(walletClient, <any>'respondToMessage').resolves()

    const id = '1234test'

    ;(<any>walletClient).pendingRequests.push([{ id }, {}])

    await walletClient.init()

    const message: BeaconResponseInputMessage = {
      id,
      type: BeaconMessageType.Error,
      errorType: BeaconErrorType.PARAMETERS_INVALID_ERROR,
      errorData: {
        test: 123
      }
    }

    await walletClient.respond(message)

    const { errorData, ...newMessage } = message

    expect(respondStub.callCount).to.equal(1)
    expect(respondStub.firstCall.args[0]).to.include(newMessage)
    expect(respondStub.firstCall.args[0].errorData).to.be.undefined
  })
})
