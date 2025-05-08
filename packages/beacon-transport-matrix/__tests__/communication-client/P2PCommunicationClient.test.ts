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
      expect(axios.get).toHaveBeenCalledWith('https://relay.test/_synapse/client/beacon/info')
      expect(info).toEqual({
        region: 'eu',
        known_servers: ['a', 'b'],
        timestamp: 9876
      })
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
