// __tests__/communication-client/P2PCommunicationClient.test.ts

// Mock external dependencies
jest.mock('axios')
jest.mock('@airgap/beacon-utils', () => {
  const actual = jest.requireActual('@airgap/beacon-utils')

  class ExposedPromise<T> {
    public promise: Promise<T>
    private _resolve!: (value: T) => void
    private _reject!: (reason?: any) => void

    constructor() {
      this.promise = new Promise<T>((res, rej) => {
        this._resolve = res
        this._reject = rej
      })
      // Prevent unhandled rejection when promise is rejected without a concurrent awaiter
      this.promise.catch(() => {})
    }
    resolve(value: T) {
      this._resolve(value)
    }
    reject(reason?: any) {
      this._reject(reason)
    }
    isResolved(): boolean {
      return true
    }
  }

  return {
    ...actual,
    ExposedPromise,
    generateGUID: jest.fn(),
    getHexHash: jest.fn(),
    recipientString: jest.fn(),
    encryptCryptoboxPayload: jest.fn(),
    decryptCryptoboxPayload: jest.fn(),
    openCryptobox: jest.fn(),
    toHex: jest.fn(),
    getKeypairFromSeed: jest.fn(),
    secretbox_NONCEBYTES: 8,
    secretbox_MACBYTES: 16
  }
})

jest.mock('../../src/matrix-client/MatrixClient', () => ({
  MatrixClient: { create: jest.fn() }
}))

// Imports
import axios from 'axios'
import {
  generateGUID,
  getHexHash,
  recipientString,
  encryptCryptoboxPayload,
  decryptCryptoboxPayload,
  openCryptobox,
  toHex,
  getKeypairFromSeed
} from '@airgap/beacon-utils'
import { MatrixClient } from '../../src/matrix-client/MatrixClient'
import { StorageKey } from '@airgap/beacon-types'
import { P2PCommunicationClient } from '../../src/communication-client/P2PCommunicationClient'

describe('P2PCommunicationClient', () => {
  let client: P2PCommunicationClient
  const mockStorage = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }
  const fakeKeyPair = { publicKey: 'pub', secretKey: 'sec' }

  beforeEach(() => {
    jest.clearAllMocks()

    // beacon-utils mocks
    ;(generateGUID as jest.Mock).mockResolvedValue('generated-guid')
    ;(getHexHash as jest.Mock).mockResolvedValue('hex-hash')
    ;(recipientString as jest.Mock).mockReturnValue('@hex-hash:relay.server')
    ;(encryptCryptoboxPayload as jest.Mock).mockResolvedValue('encrypted-payload')
    ;(decryptCryptoboxPayload as jest.Mock).mockResolvedValue('decrypted-payload')
    ;(openCryptobox as jest.Mock).mockResolvedValue(JSON.stringify({ foo: 'bar' }))
    ;(toHex as jest.Mock).mockReturnValue('deadbeef')
    ;(getKeypairFromSeed as jest.Mock).mockResolvedValue(fakeKeyPair)

    // MatrixClient.create stub
    const fakeMatrixClient = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      unsubscribeAll: jest.fn(),
      joinRooms: jest.fn(),
      sendTextMessage: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      getRoomById: jest.fn().mockResolvedValue({ members: ['@peer:relay'] }),
      createTrustedPrivateRoom: jest.fn().mockResolvedValue('!room:id'),
      joinedRooms: Promise.resolve([])
    }
    ;(MatrixClient.create as jest.Mock).mockReturnValue(fakeMatrixClient)

    client = new P2PCommunicationClient('MyApp', fakeKeyPair as any, 2, mockStorage as any)

    // Stub getPublicKey and getRelayServer
    ;(client as any).getPublicKey = jest.fn().mockResolvedValue('pub')
    jest
      .spyOn(client as any, 'getRelayServer')
      .mockResolvedValue({ server: 'relay.server', timestamp: 1234 })
  })

  describe('getPairingRequestInfo', () => {
    it('builds a P2PPairingRequest with id, name, publicKey, version & relayServer', async () => {
      const req = await client.getPairingRequestInfo()
      expect(generateGUID).toHaveBeenCalled()
      expect(req.id).toBe('generated-guid')
      expect(req.name).toBe('MyApp')
      expect(req.publicKey).toBe('pub')
      expect(req.version).toBeDefined()
      expect(req.relayServer).toBe('relay.server')
    })
  })

  describe('getPairingResponseInfo', () => {
    it('builds a P2PPairingResponse using current relayServer, not request’s', async () => {
      const fakeRequest = {
        id: 'req-id',
        name: 'peer-name',
        publicKey: 'peer-pub',
        version: '1.0.0',
        relayServer: 'relay.peer'
      }
      const res = await client.getPairingResponseInfo(fakeRequest as any)
      expect(res.id).toBe('req-id')
      expect(res.name).toBe('MyApp')
      expect(res.publicKey).toBe('pub')
      expect(res.version).toBe('1.0.0')
      // now matches stubbed getRelayServer()
      expect(res.relayServer).toBe('relay.server')
    })
  })

  describe('getBeaconInfo', () => {
    it('fetches /_synapse/client/beacon/info and maps the response', async () => {
      ;(axios.get as jest.Mock).mockResolvedValue({
        data: {
          region: 'eu',
          known_servers: ['a', 'b'],
          timestamp: 9876
        }
      })
      const info = await client.getBeaconInfo('relay.test')
      expect(axios.get).toHaveBeenCalledWith(
        'https://relay.test/_synapse/client/beacon/info',
        { timeout: 10_000 }
      )
      expect(info).toEqual({
        region: 'eu',
        known_servers: ['a', 'b'],
        timestamp: 9876
      })
    })
  })

  describe('getRelayServer (dead node recovery)', () => {
    let freshClient: P2PCommunicationClient

    beforeEach(() => {
      freshClient = new P2PCommunicationClient('MyApp', fakeKeyPair as any, 2, mockStorage as any)
    })

    it('falls through to server discovery when stored node is unreachable', async () => {
      // Stored node exists but is dead
      mockStorage.get.mockResolvedValue('dead-node.papers.tech')
      mockStorage.delete.mockResolvedValue(undefined)
      mockStorage.set.mockResolvedValue(undefined)

      // First call (stored node) rejects, second call (discovery probe) succeeds
      ;(axios.get as jest.Mock)
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue({
          data: { region: 'eu', known_servers: ['a'], timestamp: 5000 }
        })

      const result = await freshClient.getRelayServer()

      // Should have deleted the dead node from storage
      expect(mockStorage.delete).toHaveBeenCalledWith(StorageKey.MATRIX_SELECTED_NODE)

      // Should have resolved via discovery
      expect(result.server).toBeDefined()
      expect(result.timestamp).toBe(5000)
    })

    it('uses stored node when it is reachable', async () => {
      mockStorage.get.mockResolvedValue('healthy-node.papers.tech')

      ;(axios.get as jest.Mock).mockResolvedValue({
        data: { region: 'eu', known_servers: ['a'], timestamp: 7777 }
      })

      const result = await freshClient.getRelayServer()

      expect(result.server).toBe('healthy-node.papers.tech')
      expect(result.timestamp).toBe(7777)
      // Should NOT have deleted the node
      expect(mockStorage.delete).not.toHaveBeenCalledWith(StorageKey.MATRIX_SELECTED_NODE)
    })

    it('rejects ExposedPromise when all servers fail, preventing concurrent caller deadlock', async () => {
      mockStorage.get.mockResolvedValue('')
      mockStorage.delete.mockResolvedValue(undefined)

      // All discovery probes fail
      ;(axios.get as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'))

      await expect(freshClient.getRelayServer()).rejects.toThrow()

      // The ExposedPromise should be cleared so subsequent callers get a fresh attempt
      expect((freshClient as any).relayServer).toBeUndefined()
    })

    it('resets and retries when cached relay server becomes unreachable on timestamp refresh', async () => {
      mockStorage.get.mockResolvedValue('')
      mockStorage.set.mockResolvedValue(undefined)
      mockStorage.delete.mockResolvedValue(undefined)

      // First getRelayServer call: no stored node, discovery finds a server
      ;(axios.get as jest.Mock).mockResolvedValue({
        data: { region: 'eu', known_servers: ['a'], timestamp: 1000 }
      })

      const firstResult = await freshClient.getRelayServer()
      expect(firstResult.timestamp).toBe(1000)

      // Force the localTimestamp to be old so the stale-timestamp refresh path triggers
      const relayServerPromise = (freshClient as any).relayServer
      if (relayServerPromise) {
        const resolved = await relayServerPromise.promise
        resolved.localTimestamp = 0
      }

      // The refresh call to the cached server fails (ETIMEDOUT).
      // The recovery path resets state and retries via findBestRegionAndGetServer(),
      // which probes all servers. Set up the mock so the first call rejects,
      // then all subsequent calls (discovery probes) succeed with a new timestamp.
      ;(axios.get as jest.Mock)
        .mockReset()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue({
          data: { region: 'us', known_servers: ['b'], timestamp: 2000 }
        })

      const secondResult = await freshClient.getRelayServer()

      expect(secondResult.timestamp).toBe(2000)
      expect(mockStorage.delete).toHaveBeenCalledWith(StorageKey.MATRIX_SELECTED_NODE)
    })
  })

  describe('updatePeerRoom', () => {
    it('throws if sender is invalid', async () => {
      await expect(client.updatePeerRoom('invalid-sender', '!room')).rejects.toThrow(
        'Invalid sender'
      )
    })

    it('pushes the 2nd character of old room into ignoredRooms and updates storage', async () => {
      const sender = '@abcdef:relay.server'
      const oldRoom = '!old:room'
      mockStorage.get.mockResolvedValue({ [sender]: oldRoom })
      mockStorage.set.mockResolvedValue(undefined)

      await client.updatePeerRoom(sender, '!new:room')

      // per implementation, room[1] === 'o' is what gets pushed
      expect((client as any).ignoredRooms).toContain(oldRoom[1])
      expect(mockStorage.set).toHaveBeenCalledWith(StorageKey.MATRIX_PEER_ROOM_IDS, {
        [sender]: '!new:room'
      })
    })
  })
})
