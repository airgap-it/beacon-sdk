import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import {
  LocalStorage,
  ChromeMessageTransport,
  TransportStatus,
  ExtensionMessageTarget
} from '../../src'
import { PeerManager } from '../../src/managers/PeerManager'
import { ChromeMessageClient } from '../../src/transports/ChromeMessageClient'
import { PostMessagePairingResponse } from '../../src/types/PostMessagePairingResponse'
import { getKeypairFromSeed } from '../../src/utils/crypto'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const pairingResponse: PostMessagePairingResponse = {
  name: 'test-wallet',
  publicKey: 'asdf'
}

describe(`ChromeMessageTransport`, () => {
  let transport: ChromeMessageTransport
  let transportConnectStub: sinon.SinonStub<any[], any>

  beforeEach(async () => {
    sinon.restore()

    const keypair = await getKeypairFromSeed('test')
    const localStorage = new LocalStorage()

    sinon.stub(ChromeMessageClient.prototype, <any>'init').resolves()
    sinon.stub(ChromeMessageTransport.prototype, <any>'init').resolves()
    transportConnectStub = sinon.stub(ChromeMessageTransport.prototype, <any>'connect').resolves()

    transport = new ChromeMessageTransport('Test', keypair, localStorage)
  })

  it(`should not be supported`, async () => {
    const windowRef = globalThis.window
    const chromeRef = globalThis.chrome

    globalThis.window = {} as any
    globalThis.chrome = {} as any

    const isAvailable = await ChromeMessageTransport.isAvailable()
    expect(isAvailable).to.be.false

    globalThis.window = windowRef
    globalThis.chrome = chromeRef
  })

  it(`should be supported`, async () => {
    const windowRef = globalThis.window
    const chromeRef = globalThis.chrome

    globalThis.window = {
      ...globalThis.window,
      chrome: {
        runtime: {
          id: 'some-id'
        } as any
      } as any
    } as any

    globalThis.chrome = {
      runtime: {
        id: 'some-id'
      } as any
    } as any

    const isAvailable = await ChromeMessageTransport.isAvailable()
    expect(isAvailable).to.be.true

    globalThis.window = windowRef
    globalThis.chrome = chromeRef
  })

  it(`should connect to existing peers if there are peers stored locally`, async () => {
    sinon.stub(PeerManager.prototype, 'getPeers').resolves([pairingResponse, pairingResponse])

    const listenStub = sinon.stub(transport, <any>'listen').resolves()

    expect(transport.connectionStatus).to.equal(TransportStatus.NOT_CONNECTED)

    await transportConnectStub.wrappedMethod.apply(transport)

    expect(listenStub.callCount).to.equal(2)
    expect(transport.connectionStatus).to.equal(TransportStatus.CONNECTED)
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
    const sendResponseStub = sinon
      .stub(ChromeMessageClient.prototype, 'sendPairingResponse')
      .resolves()

    await transport.addPeer(pairingResponse)

    expect(hasPeerStub.callCount, 'hasPeerStub').to.equal(1)
    expect(hasPeerStub.firstCall.args[0], 'hasPeerStub').to.equal(pairingResponse.publicKey)
    expect(addPeerStub.callCount, 'addPeerStub').to.equal(1)
    expect(addPeerStub.firstCall.args[0], 'addPeerStub').to.equal(pairingResponse)
    expect(listenStub.callCount, 'listenStub').to.equal(1)
    expect(listenStub.firstCall.args[0], 'listenStub').to.equal(pairingResponse.publicKey)
    expect(sendResponseStub.callCount, 'sendResponseStub').to.equal(1)
    expect(sendResponseStub.firstCall.args[0], 'sendResponseStub').to.equal(
      pairingResponse.publicKey
    )
  })

  it(`should remove peer and unsubscribe`, async () => {
    const removePeerStub = sinon.stub(PeerManager.prototype, 'removePeer').resolves()
    const unsubscribeStub = sinon
      .stub(ChromeMessageClient.prototype, 'unsubscribeFromEncryptedMessage')
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
      .stub(ChromeMessageClient.prototype, 'unsubscribeFromEncryptedMessages')
      .resolves()

    await transport.removeAllPeers()

    expect(removeAllPeersSpy.callCount, 'removeAllPeersStub').to.equal(1)
    expect(removeAllPeersSpy.firstCall.args.length, 'removeAllPeersStub').to.equal(0)
    expect(unsubscribeStub.callCount, 'unsubscribeStub').to.equal(1)
    expect(unsubscribeStub.firstCall.args.length, 'unsubscribeStub').to.equal(0)
  })

  it(`should send a message to all peers`, async () => {
    const message = 'my-message'

    const windowRef = globalThis.window
    const chromeRef = globalThis.chrome

    const sendMessageStub = sinon.fake()

    globalThis.window = {
      ...globalThis.window,
      chrome: {
        runtime: {
          sendMessage: sendMessageStub
        } as any
      } as any
    } as any

    globalThis.chrome = {
      runtime: {
        sendMessage: sendMessageStub
      } as any
    } as any

    await transport.send(message)

    globalThis.window = windowRef
    globalThis.chrome = chromeRef

    expect(sendMessageStub.callCount, 'sendMessageStub').to.equal(1)
    expect(sendMessageStub.firstCall.args[0].target, 'sendMessageStub').to.equal(
      ExtensionMessageTarget.PAGE
    )
    expect(sendMessageStub.firstCall.args[0].payload, 'sendMessageStub').to.equal(message)
    expect(typeof sendMessageStub.firstCall.args[1], 'sendMessageStub').to.equal('function')
  })

  it(`should listen`, async () => {
    const message = 'my-message'
    const id = 'my-id'
    const listenStub = sinon
      .stub(ChromeMessageClient.prototype, 'listenForEncryptedMessage')
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
