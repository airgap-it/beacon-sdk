import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { DappPostMessageTransport } from '../src/transports/DappPostMessageTransport'

import { TransportStatus, Origin, ExtendedPostMessagePairingResponse } from '@mavrykdynamics/beacon-types'
import { getKeypairFromSeed } from '@mavrykdynamics/beacon-utils'
import { BEACON_VERSION, PeerManager, LocalStorage } from '@mavrykdynamics/beacon-core'
import { clearMockWindowState, windowRef } from '../../beacon-core/src/MockWindow'
import { PostMessageTransport } from '@mavrykdynamics/beacon-transport-postmessage'
import { PostMessageClient } from '@mavrykdynamics/beacon-transport-postmessage/src/PostMessageClient'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const pairingResponse: ExtendedPostMessagePairingResponse = {
  id: 'id1',
  type: 'postmessage-pairing-response',
  name: 'test-wallet',
  version: BEACON_VERSION,
  publicKey: 'asdf',
  senderId: 'senderId1',
  extensionId: 'extensionId1'
}

describe(`PostMessageTransport`, () => {
  let transport: DappPostMessageTransport

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

  beforeEach(async () => {
    sinon.restore()

    clearMockWindowState()

    const keypair = await getKeypairFromSeed('test')
    const localStorage = new LocalStorage()

    transport = new DappPostMessageTransport('Test', keypair, localStorage)
  })

  it(`should not be supported`, async () => {
    return new Promise(async (resolve, reject) => {
      let hasCompleted = false // We need this flag, otherwise once this test stops, the next one starts and then resolves our "isAvailable" promise.
      const timeout = setTimeout(() => {
        hasCompleted = true
        resolve()
      }, 300)

      await PostMessageTransport.isAvailable()
      if (!hasCompleted) {
        // We should never come here
        expect(true).to.be.false
        clearTimeout(timeout)
        reject()
      }
    })
  })

  it(`should be supported`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject()
      }, 1000)

      setTimeout(() => {
        windowRef.postMessage({ payload: 'pong' }, '*')
      }, 10)

      const isAvailable = await PostMessageTransport.isAvailable()
      expect(isAvailable).to.be.true
      clearTimeout(timeout)
      resolve()
    })
  })

  it(`should listen to new peers if no peers are stored locally`, async () => {
    const startOpenChannelListenerStub = sinon
      .stub(transport, 'startOpenChannelListener')
      .resolves()

    sinon.stub(PeerManager.prototype, 'getPeers').resolves([])

    expect(transport.connectionStatus).to.equal(TransportStatus.NOT_CONNECTED)

    await transport.connect()

    expect(startOpenChannelListenerStub.callCount).to.equal(1)
    expect(transport.connectionStatus).to.equal(TransportStatus.CONNECTED)
  })

  it(`should connect to existing peers if there are peers stored locally`, async () => {
    const listenForNewPeerStub = sinon
      .stub(transport, 'listenForNewPeer')
      .throws('listenForNewPeer should not be called')

    sinon.stub(PeerManager.prototype, 'getPeers').resolves([pairingResponse, pairingResponse])

    const listenStub = sinon.stub(transport, <any>'listen').resolves()

    expect(transport.connectionStatus).to.equal(TransportStatus.NOT_CONNECTED)

    await transport.connect()

    expect(listenForNewPeerStub.callCount).to.equal(0)
    expect(listenStub.callCount).to.equal(2)
    expect(transport.connectionStatus).to.equal(TransportStatus.CONNECTED)
  })

  it(`should connect new peer`, async () => {
    return new Promise(async (resolve) => {
      sinon
        .stub(PostMessageClient.prototype, 'listenForChannelOpening')
        .callsArgWithAsync(0, pairingResponse)

      const addPeerStub = sinon.stub(transport, 'addPeer').resolves()

      const fn = () => {
        setTimeout(() => {
          expect(addPeerStub.callCount, 'addPeer').to.equal(1)
          expect(transport.connectionStatus).to.equal(TransportStatus.CONNECTED)
          expect((<any>transport).newPeerListener, 'newPeerListener').to.equal(undefined)
          resolve()
        }, 0)
      }
      await transport.listenForNewPeer(fn)

      expect((<any>transport).newPeerListener, 'newPeerListener').to.equal(fn)

      await transport.startOpenChannelListener()
    })
  })

  it(`should get peers`, async () => {
    const returnValue: ExtendedPostMessagePairingResponse[] = []
    const getPeersStub = sinon.stub(PeerManager.prototype, 'getPeers').resolves(returnValue)

    const result = await transport.getPeers()

    expect(returnValue).to.equal(result)
    expect(getPeersStub.callCount).to.equal(1)
  })

  it(`should add peer and start to listen`, async () => {
    const addPeerStub = sinon.stub(PeerManager.prototype, 'addPeer').resolves()
    const listenStub = sinon.stub(transport, <any>'listen').resolves()

    await transport.addPeer(pairingResponse)

    expect(addPeerStub.callCount, 'addPeerStub').to.equal(1)
    expect(addPeerStub.firstCall.args[0], 'addPeerStub').to.equal(pairingResponse)
    expect(listenStub.callCount, 'listenStub').to.equal(1)
    expect(listenStub.firstCall.args[0], 'listenStub').to.equal(pairingResponse.publicKey)
  })

  it(`should remove peer and unsubscribe`, async () => {
    const removePeerStub = sinon.stub(PeerManager.prototype, 'removePeer').resolves()
    const unsubscribeStub = sinon
      .stub(PostMessageClient.prototype, 'unsubscribeFromEncryptedMessage')
      .resolves()

    await transport.removePeer(pairingResponse)

    expect(removePeerStub.callCount, 'removePeerStub').to.equal(1)
    expect(removePeerStub.firstCall.args[0], 'removePeerStub').to.equal(pairingResponse.publicKey)
    expect(unsubscribeStub.callCount, 'unsubscribeStub').to.equal(1)
    expect(unsubscribeStub.firstCall.args[0], 'unsubscribeStub').to.equal(pairingResponse.publicKey)
  })

  it(`should remove all peers`, async () => {
    const removeAllPeersSpy = sinon.spy(PeerManager.prototype, 'removeAllPeers')
    const unsubscribeStub = sinon
      .stub(PostMessageClient.prototype, 'unsubscribeFromEncryptedMessages')
      .resolves()

    await transport.removeAllPeers()

    expect(removeAllPeersSpy.callCount, 'removeAllPeersStub').to.equal(1)
    expect(removeAllPeersSpy.firstCall.args.length, 'removeAllPeersStub').to.equal(0)
    expect(unsubscribeStub.callCount, 'unsubscribeStub').to.equal(1)
    expect(unsubscribeStub.firstCall.args.length, 'unsubscribeStub').to.equal(0)
  })

  it(`should send a message to a specific peer`, async () => {
    const message = 'my-message'

    const getPeersStub = sinon.stub(PeerManager.prototype, 'getPeers').resolves([pairingResponse])
    const sendMessageStub = sinon.stub(PostMessageClient.prototype, 'sendMessage').resolves()

    await transport.send(message, pairingResponse)

    expect(getPeersStub.callCount, 'getPeersStub').to.equal(0)
    expect(sendMessageStub.callCount, 'sendMessageStub').to.equal(1)
    expect(sendMessageStub.firstCall.args[0], 'sendMessageStub').to.equal(message)
    expect(sendMessageStub.firstCall.args[1], 'sendMessageStub').to.equal(pairingResponse)
  })

  it(`should send a message to all peers`, async () => {
    const message = 'my-message'

    const sendMessageStub = sinon.stub(PostMessageClient.prototype, 'sendMessage').resolves()
    sinon.stub(PeerManager.prototype, 'getPeers').resolves([pairingResponse, pairingResponse])

    await transport.send(message)

    expect(sendMessageStub.callCount, 'sendMessageStub').to.equal(2)
    expect(sendMessageStub.firstCall.args[0], 'sendMessageStub').to.equal(message)
    expect(sendMessageStub.firstCall.args[1], 'sendMessageStub').to.equal(pairingResponse)
    expect(sendMessageStub.secondCall.args[0], 'sendMessageStub').to.equal(message)
    expect(sendMessageStub.secondCall.args[1], 'sendMessageStub').to.equal(pairingResponse)
  })

  it(`should listen`, async () => {
    return new Promise(async (resolve, _reject) => {
      const message = 'my-message'
      const id = 'my-id'
      const listenStub = sinon
        .stub(PostMessageClient.prototype, 'listenForEncryptedMessage')
        .callsArgWithAsync(1, message, { id: id })
        .resolves()
      const notifyStub = sinon.stub(<any>transport, 'notifyListeners').resolves()

      const pubKey = 'test'
      await (<any>transport).listen(pubKey)

      expect(listenStub.callCount, 'listenStub').to.equal(1)
      expect(listenStub.firstCall.args[0], 'listenStub').to.equal(pubKey)
      setTimeout(() => {
        expect(notifyStub.callCount, 'notifyStub').to.equal(1)
        expect(notifyStub.firstCall.args[0], 'notifyStub').to.equal(message)
        expect(notifyStub.firstCall.args[1].origin, 'notifyStub').to.equal(Origin.EXTENSION)
        expect(notifyStub.firstCall.args[1].id, 'notifyStub').to.equal(id)

        resolve()
      })
    })
  })
})
