// __tests__/client/WalletClient.test.ts

import axios from 'axios'
import { Client, LocalStorage } from '@airgap/beacon-core'
import { StorageKey } from '@airgap/beacon-types'
import { WalletClient } from '../../src/client/WalletClient'
import { WalletP2PTransport } from '../../src/transports/WalletP2PTransport'

jest.mock('axios')

// Stub out all of beacon-utils, including generateGUID
jest.mock('@airgap/beacon-utils', () => ({
  ExposedPromise: class {
    public promise = new Promise<boolean>(() => {})
    public resolve = jest.fn()
  },
  toHex: jest.fn().mockReturnValue('abcd'),
  generateGUID: jest.fn().mockReturnValue('guid-123')
}))

// Stub everything from beacon-core *except* Client, so subclassing still works
jest.mock('@airgap/beacon-core', () => {
  const actual = jest.requireActual('@airgap/beacon-core')
  return {
    ...actual,
    LocalStorage: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue([]),
      set: jest.fn().mockResolvedValue(undefined)
    })),
    PermissionManager: jest.fn().mockImplementation(() => ({
      getPermissions: jest.fn(),
      getPermission: jest.fn(),
      removePermissions: jest.fn(),
      removePermission: jest.fn(),
      removeAllPermissions: jest.fn()
    })),
    AppMetadataManager: jest.fn().mockImplementation(() => ({
      getAppMetadataList: jest.fn(),
      getAppMetadata: jest.fn(),
      removeAppMetadata: jest.fn(),
      removeAllAppMetadata: jest.fn()
    })),
    getSenderId: jest.fn().mockResolvedValue('sender-id'),
    Logger: jest.fn().mockImplementation(() => ({ log: jest.fn(), warn: jest.fn() }))
  }
})

jest.mock('../../src/transports/WalletP2PTransport')
jest.mock('../../src/interceptors/IncomingRequestInterceptor')
jest.mock('../../src/interceptors/OutgoingResponseInterceptor')

describe('WalletClient', () => {
  const backendUrl = 'https://my.backend'
  const accountKey = 'account-pubkey'
  const oracleUrl = 'https://oracle.test'

  let client: WalletClient
  let storage: jest.Mocked<LocalStorage>
  let initSpy: jest.SpyInstance<Promise<any>, [any?]>

  beforeEach(() => {
    jest.clearAllMocks()

    // Silence the multiple‐instances warning in BeaconClient constructor
    jest.spyOn(console, 'error').mockImplementation(() => {})

    // Spy on super.init() so we don’t actually initialize anything real
    initSpy = jest.spyOn(Client.prototype, 'init').mockResolvedValue('transport-type' as any)

    storage = new LocalStorage() as any
    client = new WalletClient({ name: 'test-client', storage })

    // *** Stub the keyPair getter so `await this.keyPair` in init() resolves immediately ***
    jest
      .spyOn(client as any, 'keyPair', 'get')
      .mockReturnValue(Promise.resolve({ publicKey: 'pub', secretKey: 'sec' } as any))
  })

  describe('init()', () => {
    it('should call super.init with a P2P transport and return its result', async () => {
      const transportType = await client.init()

      expect(transportType).toBe('transport-type')
      expect(initSpy).toHaveBeenCalledWith(expect.any(WalletP2PTransport))
      expect(WalletP2PTransport).toHaveBeenCalledWith(
        'test-client',
        expect.anything(),
        storage,
        (client as any).matrixNodes,
        client.iconUrl,
        client.appUrl
      )
    })
  })

  describe('getRegisterPushChallenge()', () => {
    beforeEach(() => {
      ;(axios.get as jest.Mock).mockResolvedValue({
        data: { id: 'challenge-id', timestamp: '2025-04-24T12:00:00Z' }
      })
    })

    it('fetches a challenge and builds payload correctly', async () => {
      const { challenge, payloadToSign } = await client.getRegisterPushChallenge(
        backendUrl,
        accountKey,
        oracleUrl
      )

      expect(axios.get).toHaveBeenCalledWith(`${oracleUrl}/challenge`)
      expect(challenge).toEqual({ id: 'challenge-id', timestamp: '2025-04-24T12:00:00Z' })
      // toHex is mocked to 'abcd'
      expect(payloadToSign).toBe('050100000004abcd')
    })
  })

  describe('registerPush()', () => {
    const challenge = { id: 'cid', timestamp: 'ts' }
    const signature = 'sig'
    const protocol = 'tezos'
    const deviceId = 'dev-123'

    it('returns existing token if found in storage', async () => {
      const existing = {
        publicKey: accountKey,
        backendUrl,
        accessToken: 'a1',
        managementToken: 'm1'
      }
      storage.get.mockResolvedValue([existing])

      const result = await client.registerPush(
        challenge,
        signature,
        backendUrl,
        accountKey,
        protocol,
        deviceId,
        oracleUrl
      )

      expect(storage.get).toHaveBeenCalledWith(StorageKey.PUSH_TOKENS)
      expect(result).toBe(existing)
      expect(axios.post).not.toHaveBeenCalled()
    })

    it('registers new token when none exists', async () => {
      storage.get.mockResolvedValue([])
      ;(axios.post as jest.Mock).mockResolvedValue({
        data: {
          accessToken: 'newA',
          managementToken: 'newM',
          message: 'ok',
          success: true
        }
      })

      const result = await client.registerPush(
        challenge,
        signature,
        backendUrl,
        accountKey,
        protocol,
        deviceId,
        oracleUrl
      )

      expect(axios.post).toHaveBeenCalledWith(`${oracleUrl}/register`, {
        name: 'test-client',
        challenge,
        accountPublicKey: accountKey,
        signature,
        backendUrl,
        protocolIdentifier: protocol,
        deviceId
      })
      expect(storage.set).toHaveBeenCalledWith(StorageKey.PUSH_TOKENS, [
        {
          publicKey: accountKey,
          backendUrl,
          accessToken: 'newA',
          managementToken: 'newM'
        }
      ])
      expect(result).toEqual({
        publicKey: accountKey,
        backendUrl,
        accessToken: 'newA',
        managementToken: 'newM'
      })
    })
  })

  describe('respond()', () => {
    it('throws if no matching pending request', async () => {
      await expect(client.respond({ id: 'nope', type: 0 } as any)).rejects.toThrow(
        'No matching request found!'
      )
    })
  })

  describe('addPeer()', () => {
    it('forwards peer info to transport.addPeer()', async () => {
      const fakePeer = { id: '1', name: 'p', publicKey: 'pk', version: '2' } as any
      const extended = { senderId: 'sender-id', ...fakePeer }
      jest.spyOn(client as any, 'getPeerInfo').mockResolvedValue(extended)

      const transportMock = { addPeer: jest.fn().mockResolvedValue(undefined) }
      jest
        .spyOn(client as any, 'transport', 'get')
        .mockReturnValue(Promise.resolve(transportMock as any))

      await client.addPeer(fakePeer)
      expect(transportMock.addPeer).toHaveBeenCalledWith(extended, true)
    })
  })
})
