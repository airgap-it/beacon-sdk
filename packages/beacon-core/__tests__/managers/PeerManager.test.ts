// __tests__/managers/PeerManager.test.ts

import { PeerManager } from '../../src/managers/PeerManager'
import { StorageKey } from '@airgap/beacon-types'

// For testing purposes we define a dummy peer type.
// When instantiated with StorageKey.TRANSPORT_P2P_PEERS_DAPP, assume the peer type is:
type Peer = { publicKey: string; name: string }

describe('PeerManager', () => {
  // Use a concrete key for testing; adjust as needed.
  let peerManager: any // PeerManager<typeof StorageKey.TRANSPORT_P2P_PEERS_DAPP> type
  let storage: any
  let mockStorageManager: {
    getAll: jest.Mock
    getOne: jest.Mock
    addOne: jest.Mock
    remove: jest.Mock
    removeAll: jest.Mock
  }

  beforeEach(() => {
    storage = {} // dummy storage instance
    // Instantiate PeerManager with a concrete key.
    // For testing, we assume StorageKey.TRANSPORT_P2P_PEERS_DAPP is a string literal.
    peerManager = new PeerManager(storage, StorageKey.TRANSPORT_P2P_PEERS_DAPP)
    // Override the internal storageManager with our mock object.
    mockStorageManager = {
      getAll: jest.fn(),
      getOne: jest.fn(),
      addOne: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    }
    // Replace the private property using bracket notation.
    peerManager['storageManager'] = mockStorageManager
  })

  describe('hasPeer', () => {
    it('should return true if peer exists', async () => {
      const peer: Peer = { publicKey: 'key1', name: 'Peer1' }
      mockStorageManager.getOne.mockResolvedValue(peer)
      const result = await peerManager.hasPeer('key1')
      expect(result).toBe(true)
    })

    it('should return false if peer does not exist', async () => {
      mockStorageManager.getOne.mockResolvedValue(undefined)
      const result = await peerManager.hasPeer('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('getPeers', () => {
    it('should return the list of peers when storage has data', async () => {
      const peers: Peer[] = [
        { publicKey: 'key1', name: 'Peer1' },
        { publicKey: 'key2', name: 'Peer2' }
      ]
      mockStorageManager.getAll.mockResolvedValue(peers)
      const result = await peerManager.getPeers()
      expect(result).toEqual(peers)
    })

    it('should return an empty array when getAll returns null', async () => {
      mockStorageManager.getAll.mockResolvedValue(null)
      const result = await peerManager.getPeers()
      expect(result).toEqual([])
    })
  })

  describe('getPeer', () => {
    it('should return the correct peer if found', async () => {
      const peer: Peer = { publicKey: 'key1', name: 'Peer1' }
      // Configure getOne so that it returns the peer when the predicate matches.
      mockStorageManager.getOne.mockImplementation(async (predicate: Function) => {
        return predicate(peer) ? peer : undefined
      })
      const result = await peerManager.getPeer('key1')
      expect(result).toEqual(peer)
    })

    it('should return undefined if peer is not found', async () => {
      mockStorageManager.getOne.mockResolvedValue(undefined)
      const result = await peerManager.getPeer('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('addPeer', () => {
    it('should add the peer', async () => {
      const peer: Peer = { publicKey: 'key1', name: 'Peer1' }
      await peerManager.addPeer(peer)
      expect(mockStorageManager.addOne).toHaveBeenCalledWith(peer, expect.any(Function))
      // Validate that the predicate function passed returns true for the added peer.
      const predicate = mockStorageManager.addOne.mock.calls[0][1]
      expect(predicate(peer)).toBe(true)
    })
  })

  describe('removePeer', () => {
    it('should remove the specified peer', async () => {
      await peerManager.removePeer('key1')
      expect(mockStorageManager.remove).toHaveBeenCalledWith(expect.any(Function))
      const predicate = mockStorageManager.remove.mock.calls[0][0]
      expect(predicate({ publicKey: 'key1', name: 'Peer1' })).toBe(true)
      expect(predicate({ publicKey: 'otherKey', name: 'Peer2' })).toBe(false)
    })
  })

  describe('removePeers', () => {
    it('should remove multiple peers', async () => {
      const publicKeys = ['key1', 'key2']
      await peerManager.removePeers(publicKeys)
      expect(mockStorageManager.remove).toHaveBeenCalledWith(expect.any(Function))
      const predicate = mockStorageManager.remove.mock.calls[0][0]
      expect(predicate({ publicKey: 'key1', name: 'Peer1' })).toBe(true)
      expect(predicate({ publicKey: 'key2', name: 'Peer2' })).toBe(true)
      expect(predicate({ publicKey: 'key3', name: 'Peer3' })).toBe(false)
    })
  })

  describe('removeAllPeers', () => {
    it('should remove all peers', async () => {
      await peerManager.removeAllPeers()
      expect(mockStorageManager.removeAll).toHaveBeenCalled()
    })
  })
})
