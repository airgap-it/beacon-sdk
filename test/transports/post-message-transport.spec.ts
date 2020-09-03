import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { BEACON_VERSION, LocalStorage, PostMessageTransport, TransportStatus } from '../../src'
import { PeerManager } from '../../src/managers/PeerManager'
import { myWindow, clearMockWindowState } from '../../src/MockWindow'
import { PostMessageClient } from '../../src/transports/clients/PostMessageClient'
import { PostMessagePairingResponse } from '../../src/types/PostMessagePairingResponse'
import { getKeypairFromSeed } from '../../src/utils/crypto'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const pairingResponse: PostMessagePairingResponse = {
  name: 'test-wallet',
  version: BEACON_VERSION,
  publicKey: 'asdf'
}

describe(`PostMessageTransport`, () => {
  let transport: PostMessageTransport

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

  beforeEach(async () => {
    sinon.restore()

    clearMockWindowState()

    const keypair = await getKeypairFromSeed('test')
    const localStorage = new LocalStorage()

    transport = new PostMessageTransport('Test', keypair, localStorage, true)
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
        myWindow.postMessage({ payload: 'pong' }, '*')
      }, 10)

      const isAvailable = await PostMessageTransport.isAvailable()
      console.log('fdsa', isAvailable)
      expect(isAvailable).to.be.true
      clearTimeout(timeout)
      resolve()
    })
  })

  it(`should listen to new peers if no peers are stored locally`, async () => {
    const connectNewPeerStub = sinon.stub(transport, 'connectNewPeer').resolves()

    sinon.stub(PeerManager.prototype, 'getPeers').resolves([])

    expect(transport.connectionStatus).to.equal(TransportStatus.NOT_CONNECTED)

    await transport.connect()

    expect(connectNewPeerStub.callCount).to.equal(1)
    expect(transport.connectionStatus).to.equal(TransportStatus.CONNECTED)
    expect((<any>transport).listeningForChannelOpenings).to.be.false
  })

  it(`should connect to existing peers if there are peers stored locally`, async () => {
    const connectNewPeerStub = sinon
      .stub(transport, 'connectNewPeer')
      .throws('ConnectNewPeer should not be called')

    sinon.stub(PeerManager.prototype, 'getPeers').resolves([pairingResponse, pairingResponse])

    const listenStub = sinon.stub(transport, <any>'listen').resolves()

    expect(transport.connectionStatus).to.equal(TransportStatus.NOT_CONNECTED)

    await transport.connect()

    expect(connectNewPeerStub.callCount).to.equal(0)
    expect(listenStub.callCount).to.equal(2)
    expect(transport.connectionStatus).to.equal(TransportStatus.CONNECTED)
    expect((<any>transport).listeningForChannelOpenings).to.be.false
  })

  it(`should reconnect`, async () => {
    const connectNewPeerStub = sinon.stub(transport, 'connectNewPeer').resolves()

    await transport.reconnect()

    expect(connectNewPeerStub.callCount).to.equal(1)
  })

  it(`should connect new peer`, async () => {
    const connectNewPeerSpy = sinon.spy(transport, 'connectNewPeer')

    sinon
      .stub(PostMessageClient.prototype, 'listenForChannelOpening')
      .callsArgWithAsync(0, pairingResponse)

    const addPeerStub = sinon.stub(transport, 'addPeer').resolves()

    await transport.connectNewPeer()

    expect(connectNewPeerSpy.callCount).to.equal(1)
    expect(addPeerStub.callCount).to.equal(1)
    expect((transport as any).listeningForChannelOpenings).to.be.true
  })

  it(`should get peers`, async () => {
    const returnValue = []
    const getPeersStub = sinon.stub(PeerManager.prototype, 'getPeers').resolves(returnValue)

    const result = await transport.getPeers()

    expect(returnValue).to.equal(result)
    expect(getPeersStub.callCount).to.equal(1)
  })

  it(`should add peer and start to listen`, async () => {
    const hasPeerStub = sinon.stub(PeerManager.prototype, 'hasPeer').resolves(false)
    const addPeerStub = sinon.stub(PeerManager.prototype, 'addPeer').resolves()
    const listenStub = sinon.stub(transport, <any>'listen').resolves()

    await transport.addPeer(pairingResponse)

    expect(hasPeerStub.callCount, 'hasPeerStub').to.equal(1)
    expect(hasPeerStub.firstCall.args[0], 'hasPeerStub').to.equal(pairingResponse.publicKey)
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
    const recipient = 'my-recipient'

    const sendMessageStub = sinon.stub(PostMessageClient.prototype, 'sendMessage').resolves()

    await transport.send(message, recipient)

    expect(sendMessageStub.callCount, 'sendMessageStub').to.equal(1)
    expect(sendMessageStub.firstCall.args[0], 'sendMessageStub').to.equal(recipient)
    expect(sendMessageStub.firstCall.args[1], 'sendMessageStub').to.equal(message)
  })

  it(`should send a message to all peers`, async () => {
    const message = 'my-message'

    const sendMessageStub = sinon.stub(PostMessageClient.prototype, 'sendMessage').resolves()
    sinon.stub(PeerManager.prototype, 'getPeers').resolves([pairingResponse, pairingResponse])

    await transport.send(message)

    expect(sendMessageStub.callCount, 'sendMessageStub').to.equal(2)
    expect(sendMessageStub.firstCall.args[0], 'sendMessageStub').to.equal(pairingResponse.publicKey)
    expect(sendMessageStub.firstCall.args[1], 'sendMessageStub').to.equal(message)
    expect(sendMessageStub.secondCall.args[0], 'sendMessageStub').to.equal(
      pairingResponse.publicKey
    )
    expect(sendMessageStub.secondCall.args[1], 'sendMessageStub').to.equal(message)
  })

  it(`should listen`, async () => {
    const message = 'my-message'
    const id = 'my-id'
    const listenStub = sinon
      .stub(PostMessageClient.prototype, 'listenForEncryptedMessage')
      .callsArgWithAsync(1, message, { id: id })
      .resolves()
    // const notifyStub = sinon.stub(<any>transport, 'notifyListeners').resolves()

    const pubKey = 'test'
    await (<any>transport).listen(pubKey)

    expect(listenStub.callCount, 'listenStub').to.equal(1)
    expect(listenStub.firstCall.args[0], 'listenStub').to.equal(pubKey)
    // expect(notifyStub.callCount, 'notifyStub').to.equal(3)
    // expect(notifyStub.firstCall.args[0], 'notifyStub').to.equal(message)
    // expect(notifyStub.firstCall.args[1].origin, 'notifyStub').to.equal(Origin.EXTENSION)
    // expect(notifyStub.firstCall.args[1].id, 'notifyStub').to.equal(id)
  })
})
