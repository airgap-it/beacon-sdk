// __tests__/communication-client/P2PCommunicationClient.test.ts

import { P2PCommunicationClient } from '../../src/communication-client/P2PCommunicationClient'
import { P2PPairingRequest, P2PPairingResponse, StorageKey } from '@airgap/beacon-types'
import { BEACON_VERSION } from '@airgap/beacon-core'
import { ExposedPromise } from '@airgap/beacon-utils'

// --- Mocks for external modules ---
jest.mock('axios')
jest.mock('@airgap/beacon-utils', () => {
  const originalModule = jest.requireActual('@airgap/beacon-utils')
  return {
    ...originalModule,
    generateGUID: jest.fn(() => Promise.resolve('GUID')),
    getHexHash: jest.fn(() => Promise.resolve('hexhash')),
    toHex: jest.fn(() => 'toHexResult'),
    recipientString: jest.fn(() => 'recipient'),
    openCryptobox: jest.fn(() => Promise.resolve(JSON.stringify({ test: 'data' }))),
    encryptCryptoboxPayload: jest.fn(() => Promise.resolve('encryptedMessage')),
    decryptCryptoboxPayload: jest.fn(() => Promise.resolve('decryptedMessage')),
    getKeypairFromSeed: jest.fn(() =>
      Promise.resolve({
        publicKey: Buffer.from('pub'),
        secretKey: Buffer.from('sec'.padEnd(64, '0'))
      })
    )
  }
})

// Minimal fake implementation for MatrixClient
jest.mock('../../src/matrix-client/MatrixClient', () => {
  return {
    MatrixClient: {
      create: jest.fn(() => {
        return {
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
          unsubscribeAll: jest.fn(),
          joinRooms: jest.fn(() => Promise.resolve()),
          sendTextMessage: jest.fn(() => Promise.resolve()),
          start: jest.fn(() => Promise.resolve()),
          stop: jest.fn(() => Promise.resolve()),
          getRoomById: jest.fn(() =>
            Promise.resolve({ id: 'room1', members: ['member1', 'member2'] })
          ),
          createTrustedPrivateRoom: jest.fn(() => Promise.resolve('room1')),
          joinedRooms: [{ id: 'room1', members: ['recipient'] }]
        }
      })
    }
  }
})

// --- Fake storage ---
const fakeStorage: any = {
  get: jest.fn(() => Promise.resolve({})),
  set: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve())
}

// --- Test Suite ---
describe('P2PCommunicationClient', () => {
  let client: any // instance of P2PCommunicationClient
  // Provide a fake key pair with proper lengths:
  const fakeKeyPair = {
    publicKey: Buffer.alloc(32, 1),
    secretKey: Buffer.alloc(64, 1)
  }

  beforeEach(() => {
    client = new P2PCommunicationClient('TestClient', fakeKeyPair, 1, fakeStorage)
    // Stub methods which the class uses internally.
    jest.spyOn(client, 'getPublicKey').mockResolvedValue('pubkey')
    jest.spyOn(client, 'getPublicKeyHash').mockResolvedValue('pubkeyhash')
    // For these tests, override storage for MATRIX_SELECTED_NODE so that getRelayServer returns "relay.server"
    fakeStorage.get.mockImplementation((key: string) => {
      if (key === StorageKey.MATRIX_SELECTED_NODE) {
        return Promise.resolve('relay.server')
      }
      return Promise.resolve({})
    })
    // Create a fake Matrix client via the ExposedPromise.
    client['client'] = new ExposedPromise()
    client['client'].resolve({
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      unsubscribeAll: jest.fn(),
      joinRooms: jest.fn(() => Promise.resolve()),
      createTrustedPrivateRoom: jest.fn(() => Promise.resolve('room1')),
      sendTextMessage: jest.fn(() => Promise.resolve()),
      stop: jest.fn(() => Promise.resolve()),
      getRoomById: jest.fn(() => Promise.resolve({ id: 'room1', members: ['member1', 'member2'] })),
      joinedRooms: [{ id: 'room1', members: ['recipient'] }]
    })
    jest.spyOn(client, 'getBeaconInfo').mockResolvedValue({
      region: 'EUROPE_WEST',
      known_servers: ['server1'],
      timestamp: Date.now()
    })
    jest.spyOn(client, 'updateRelayServer').mockResolvedValue(undefined)
    jest.spyOn(client, 'updatePeerRoom').mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getPairingRequestInfo', () => {
    it('should return a valid pairing request info', async () => {
      const info: P2PPairingRequest = await client.getPairingRequestInfo()
      expect(info.id).toBe('GUID')
      expect(info.name).toBe('TestClient')
      expect(info.publicKey).toBe('pubkey')
      expect(info.version).toBe(BEACON_VERSION)
      // Expect relay server to be "relay.server" because our fakeStorage returns that.
      expect(info.relayServer).toBe('relay.server')
    })
  })

  describe('getPairingResponseInfo', () => {
    it('should return a valid pairing response info', async () => {
      const dummyRequest: any = {
        id: 'requestId',
        name: 'Requestor',
        publicKey: 'requestPubKey',
        version: '2.0',
        relayServer: 'relay.server'
      }
      const info: P2PPairingResponse = await client.getPairingResponseInfo(dummyRequest)
      expect(info.id).toBe(dummyRequest.id)
      expect(info.name).toBe('TestClient')
      expect(info.publicKey).toBe('pubkey')
      expect(info.version).toBe(dummyRequest.version)
      expect(info.relayServer).toBe('relay.server')
    })
  })

  describe('findBestRegionAndGetServer', () => {
    it('should return the fastest region server', async () => {
      const now = Date.now()
      jest.spyOn(client, 'getBeaconInfo').mockImplementation(async (server: any) => {
        return { region: 'EUROPE_WEST', known_servers: [server], timestamp: now }
      })
      const result = await client.findBestRegionAndGetServer()
      expect(result).toHaveProperty('server')
      expect(result).toHaveProperty('timestamp', now)
    })
  })

  describe('getRelayServer', () => {
    it('should return a relay server from storage if available', async () => {
      // For this test, fakeStorage.get for MATRIX_SELECTED_NODE returns "storedNode".
      fakeStorage.get = jest.fn((key: string) => {
        if (key === StorageKey.MATRIX_SELECTED_NODE) {
          return Promise.resolve('storedNode')
        }
        return Promise.resolve({})
      })
      const result = await client.getRelayServer()
      expect(result.server).toBe('storedNode')
    })

    it('should throw an error when no server is found', async () => {
      fakeStorage.get = jest.fn().mockResolvedValue(null)
      jest.spyOn(client, 'findBestRegionAndGetServer').mockResolvedValue(undefined)
      await expect(client.getRelayServer()).rejects.toThrow('No servers found')
    })
  })

  describe('start and stop', () => {
    it('should start the client and resolve the matrix client promise', async () => {
      await client.start()
      expect(client['client'].isResolved()).toBe(true)
    })

    it('should stop the client and reset state', async () => {
      const stopSpy = jest
        .spyOn(await client['client'].promise, 'stop')
        .mockResolvedValue(undefined)
      await client.stop()
      expect(stopSpy).toHaveBeenCalled()
      expect(client.relayServer).toBeUndefined()
      expect(client['initialEvent']).toBeUndefined()
    })
  })

  describe('listenForEncryptedMessage', () => {
    it('should invoke the message callback for a valid encrypted message', async () => {
      const messageCallback = jest.fn()
      jest
        .spyOn(client, 'createCryptoBoxServer')
        .mockResolvedValue({ send: 'sendKey', receive: 'receiveKey' })
      jest.spyOn(client, 'isTextMessage').mockReturnValue(true)
      jest.spyOn(client, 'isSender').mockResolvedValue(true)
      jest.spyOn(client, 'updateRelayServer').mockResolvedValue(undefined)
      jest.spyOn(client, 'updatePeerRoom').mockResolvedValue(undefined)
      // Create a fake event with a payload (the actual content is irrelevant since decryption is mocked)
      const fakeEvent = {
        content: {
          message: {
            sender: 'senderId',
            content: 'a'.repeat(100)
          }
        },
        timestamp: Date.now()
      }
      await client.listenForEncryptedMessage('someSenderPublicKey', messageCallback)
      const subCallback = (await client['client'].promise).subscribe.mock.calls[0][1]
      await subCallback(fakeEvent)
      expect(messageCallback).toHaveBeenCalledWith('decryptedMessage')
    })
  })

  describe('sendMessage', () => {
    it('should send an encrypted message and retry on M_FORBIDDEN', async () => {
      jest
        .spyOn(client, 'getRelayServer')
        .mockResolvedValue({ server: 'relay.server', timestamp: Date.now() })
      jest.spyOn(client, 'getRelevantRoom').mockResolvedValue('room1')
      jest.spyOn(client, 'waitForJoin').mockResolvedValue(undefined)
      jest.spyOn(client, 'encryptMessageAsymmetric').mockResolvedValue('encryptedMessage')
      const matrixClient = await client['client'].promise
      const sendTextMessageMock = jest
        .fn()
        .mockRejectedValueOnce({ errcode: 'M_FORBIDDEN' })
        .mockResolvedValueOnce(undefined)
      matrixClient.sendTextMessage = sendTextMessageMock
      jest.spyOn(client, 'deleteRoomIdFromRooms').mockResolvedValue(undefined)
      await client.sendMessage('hello', {
        id: 'pairingId',
        publicKey: 'peerPublicKey',
        relayServer: 'relay.server',
        version: '2.0'
      } as any)
      // Wait a short time for the retry branch to complete.
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(sendTextMessageMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('deleteRoomIdFromRooms', () => {
    it('should remove a room id from storage and add it to ignoredRooms', async () => {
      const initialRooms = {
        '@abc:relay.server': 'roomToDelete',
        '@def:relay.server': 'anotherRoom'
      }
      fakeStorage.get = jest.fn().mockResolvedValue(initialRooms)
      fakeStorage.set = jest.fn().mockResolvedValue(undefined)
      await client.deleteRoomIdFromRooms('roomToDelete')
      expect(fakeStorage.set).toHaveBeenCalledWith(StorageKey.MATRIX_PEER_ROOM_IDS, {
        '@def:relay.server': 'anotherRoom'
      })
      expect(client['ignoredRooms']).toContain('roomToDelete')
    })
  })

  // Additional tests for other methods could be added here.
})
