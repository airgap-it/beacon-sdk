import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import {
  BEACON_VERSION,
  LocalStorage,
  Origin,
  P2PCommunicationClient,
  P2PPairingRequest,
  P2PTransport,
  TransportStatus
} from '../../src'
import { BeaconEventHandler } from '../../src/events'
import { PeerManager } from '../../src/managers/PeerManager'
import { getKeypairFromSeed } from '../../src/utils/crypto'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const pairingResponse: P2PPairingRequest = {
  name: 'test-wallet',
  version: BEACON_VERSION,
  publicKey: 'asdf',
  relayServer: 'myserver.com'
}

describe(`P2PTransport`, () => {
  let transport: P2PTransport

  beforeEach(async () => {
    sinon.restore()

    const keypair = await getKeypairFromSeed('test')
    const localStorage = new LocalStorage()
    const eventHandler = new BeaconEventHandler()
    sinon.stub(eventHandler, 'emit').resolves()

    transport = new P2PTransport('Test', keypair, localStorage, [], true)
  })

  it(`should be supported`, async () => {
    const isAvailable = await P2PTransport.isAvailable()
    expect(isAvailable).to.be.true
  })

  it(`should listen to new peers if no peers are stored locally`, async () => {
    const connectNewPeerStub = sinon.stub(transport, 'connectNewPeer').resolves()

    sinon.stub(PeerManager.prototype, 'getPeers').resolves([])
    const startClientStub = sinon.stub(P2PCommunicationClient.prototype, 'start').resolves()

    expect(transport.connectionStatus).to.equal(TransportStatus.NOT_CONNECTED)

    await transport.connect()

    expect(startClientStub.callCount).to.equal(1)
    expect(connectNewPeerStub.callCount).to.equal(1)
    expect(transport.connectionStatus).to.equal(TransportStatus.CONNECTED)
    expect((<any>transport).listeningForChannelOpenings).to.be.false
  })

  it(`should connect to existing peers if there are peers stored locally`, async () => {
    const connectNewPeerStub = sinon
      .stub(transport, 'connectNewPeer')
      .throws('ConnectNewPeer should not be called')

    const startClientStub = sinon.stub(P2PCommunicationClient.prototype, 'start').resolves()
    sinon.stub(PeerManager.prototype, 'getPeers').resolves([pairingResponse, pairingResponse])

    const listenStub = sinon.stub(transport, <any>'listen').resolves()

    expect(transport.connectionStatus).to.equal(TransportStatus.NOT_CONNECTED)

    await transport.connect()

    expect(startClientStub.callCount).to.equal(1)
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
      .stub(P2PCommunicationClient.prototype, 'listenForChannelOpening')
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
    const sendResponseStub = sinon
      .stub(P2PCommunicationClient.prototype, 'sendPairingResponse')
      .resolves()

    await transport.addPeer(pairingResponse)

    expect(hasPeerStub.callCount, 'hasPeerStub').to.equal(1)
    expect(hasPeerStub.firstCall.args[0], 'hasPeerStub').to.equal(pairingResponse.publicKey)
    expect(addPeerStub.callCount, 'addPeerStub').to.equal(1)
    expect(addPeerStub.firstCall.args[0], 'addPeerStub').to.equal(pairingResponse)
    expect(listenStub.callCount, 'listenStub').to.equal(1)
    expect(listenStub.firstCall.args[0], 'listenStub').to.equal(pairingResponse.publicKey)
    expect(sendResponseStub.callCount, 'sendResponseStub').to.equal(1)
    expect(sendResponseStub.firstCall.args[0], 'sendResponseStub').to.deep.equal(pairingResponse)
  })

  it(`should remove peer and unsubscribe`, async () => {
    const removePeerStub = sinon.stub(PeerManager.prototype, 'removePeer').resolves()
    const unsubscribeStub = sinon
      .stub(P2PCommunicationClient.prototype, 'unsubscribeFromEncryptedMessage')
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
      .stub(P2PCommunicationClient.prototype, 'unsubscribeFromEncryptedMessages')
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
    const sendMessageStub = sinon.stub(P2PCommunicationClient.prototype, 'sendMessage').resolves()

    await transport.send(message, pairingResponse.publicKey)

    expect(getPeersStub.callCount, 'getPeersStub').to.equal(1)
    expect(getPeersStub.firstCall.args.length, 'getPeersStub').to.equal(0)
    expect(sendMessageStub.callCount, 'sendMessageStub').to.equal(1)
    expect(sendMessageStub.firstCall.args[0], 'sendMessageStub').to.equal(pairingResponse.publicKey)
    expect(sendMessageStub.firstCall.args[1], 'sendMessageStub').to.equal(message)
  })

  it(`should send a message to all peers`, async () => {
    const message = 'my-message'

    const sendMessageStub = sinon.stub(P2PCommunicationClient.prototype, 'sendMessage').resolves()
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
    return new Promise(async (resolve, _reject) => {
      const message = 'my-message'
      const id = 'my-id'
      const listenStub = sinon
        .stub(P2PCommunicationClient.prototype, 'listenForEncryptedMessage')
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
        expect(notifyStub.firstCall.args[1].origin, 'notifyStub').to.equal(Origin.P2P)
        expect(notifyStub.firstCall.args[1].id, 'notifyStub').to.equal(pubKey)

        resolve()
      })
    })
  })
})
