import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { PeerManager } from '../../src/managers/PeerManager'

import { StorageKey, P2PPairingRequest } from '@mavrykdynamics/beacon-types'
import { FileStorage, writeLocalFile } from '../../../../test/test-utils/FileStorage'
import { BEACON_VERSION } from '../../src/'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const peer1: P2PPairingRequest = {
  id: 'id1',
  type: 'p2p-pairing-request',
  name: 'p1',
  version: BEACON_VERSION,
  publicKey: 'pubkey1',
  relayServer: 'relay1'
}

const peer2: P2PPairingRequest = {
  id: 'id2',
  type: 'p2p-pairing-request',
  name: 'p2',
  version: BEACON_VERSION,
  publicKey: 'pubkey2',
  relayServer: 'relay2'
}

const peer3: P2PPairingRequest = {
  id: 'id3',
  type: 'p2p-pairing-request',
  name: 'p3',
  version: BEACON_VERSION,
  publicKey: 'pubkey3',
  relayServer: 'relay3'
}

describe(`PeerManager`, () => {
  let manager: PeerManager<StorageKey.TRANSPORT_P2P_PEERS_DAPP>
  beforeEach(async () => {
    await writeLocalFile({})

    manager = new PeerManager(new FileStorage(), StorageKey.TRANSPORT_P2P_PEERS_DAPP)
  })
  it(`reads and adds peers`, async () => {
    const peersBefore: P2PPairingRequest[] = await manager.getPeers()
    expect(peersBefore.length, 'before').to.equal(0)

    await manager.addPeer(peer1)
    const peersAfter: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfter.length, 'after').to.equal(1)
  })

  it(`overwrites an existing peer`, async () => {
    const peersBefore: P2PPairingRequest[] = await manager.getPeers()
    expect(peersBefore.length, 'before').to.equal(0)

    await manager.addPeer(peer1)
    const peersAfterAdding: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfterAdding.length, 'after adding').to.equal(1)

    const newPeer1: P2PPairingRequest = { ...peer1, name: 'new name' }

    await manager.addPeer(newPeer1)
    const peersAfterReplacing: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfterReplacing.length, 'after replacing').to.equal(1)
    expect(peersAfterReplacing[0].name, 'after replacing').to.deep.equal(newPeer1.name)
  })

  it(`reads, adds and checks peers`, async () => {
    const peersBefore: P2PPairingRequest[] = await manager.getPeers()
    expect(peersBefore.length, 'before').to.equal(0)

    await manager.addPeer(peer1)
    const hasPeer: boolean = await manager.hasPeer(peer1.publicKey)

    expect(hasPeer, 'hasPeer').to.be.true
  })

  it(`reads and adds multiple peers`, async () => {
    const peersBefore: P2PPairingRequest[] = await manager.getPeers()
    expect(peersBefore.length, 'before').to.equal(0)

    await manager.addPeer(peer1)
    await manager.addPeer(peer2)
    const peersAfter: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfter.length, 'after').to.equal(2)
  })

  it(`only adds an peer once`, async () => {
    const peersBefore: P2PPairingRequest[] = await manager.getPeers()
    expect(peersBefore.length, 'before').to.equal(0)

    await manager.addPeer(peer1)
    await manager.addPeer(peer1)
    const peersAfter: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfter.length, 'after').to.equal(1)
  })

  it(`reads one peer`, async () => {
    const peersBefore: P2PPairingRequest[] = await manager.getPeers()
    expect(peersBefore.length, 'before').to.equal(0)

    await manager.addPeer(peer1)
    await manager.addPeer(peer2)
    const peer = await manager.getPeer(peer1.publicKey)
    expect(peer, 'after').to.deep.include(peer1)
  })

  it(`removes one peer`, async () => {
    const peersBefore: P2PPairingRequest[] = await manager.getPeers()
    expect(peersBefore.length, 'before').to.equal(0)

    await manager.addPeer(peer1)
    await manager.addPeer(peer2)
    await manager.addPeer(peer3)
    const peersAfter: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfter.length, 'after add').to.equal(3)

    await manager.removePeer(peer1.publicKey)
    const peersAfterRemove: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfterRemove.length, 'after remove').to.equal(2)
    expect(peersAfterRemove, 'after remove, peer2').to.deep.include(peer2)
    expect(peersAfterRemove, 'after remove, peer3').to.deep.include(peer3)
  })

  it(`removes many peers`, async () => {
    const peersBefore: P2PPairingRequest[] = await manager.getPeers()
    expect(peersBefore.length, 'before').to.equal(0)

    await manager.addPeer(peer1)
    await manager.addPeer(peer2)
    await manager.addPeer(peer3)
    const peersAfter: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfter.length, 'after add').to.equal(3)

    await manager.removePeers([peer1.publicKey, peer2.publicKey])
    const peersAfterRemove: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfterRemove.length, 'after remove').to.equal(1)
    expect(peersAfterRemove, 'after remove').to.deep.include(peer3)
  })

  it(`removes all peers`, async () => {
    const peersBefore: P2PPairingRequest[] = await manager.getPeers()
    expect(peersBefore.length, 'before').to.equal(0)

    await manager.addPeer(peer1)
    await manager.addPeer(peer2)
    await manager.addPeer(peer3)
    const peersAfter: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfter.length, 'after add').to.equal(3)

    await manager.removeAllPeers()
    const peersAfterRemove: P2PPairingRequest[] = await manager.getPeers()

    expect(peersAfterRemove.length, 'after remove').to.equal(0)
  })
})
