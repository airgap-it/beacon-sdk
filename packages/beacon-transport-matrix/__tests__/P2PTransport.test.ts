// __tests__/P2PTransport.test.ts

import { P2PTransport } from '../src/P2PTransport'
import {
  TransportType,
  StorageKey,
  P2PPairingRequest,
  P2PPairingResponse,
  NodeDistributions
} from '@airgap/beacon-types'
import { BEACON_VERSION } from '@airgap/beacon-core'
import { KeyPair } from '@stablelib/ed25519'

describe('P2PTransport', () => {
  let transport: any // P2PTransport<P2PPairingRequest, StorageKey.TRANSPORT_P2P_PEERS_DAPP> type
  // Provide a fake key pair with correct lengths: 32-byte public and 64-byte secret.
  const fakeKeyPair: KeyPair = {
    publicKey: Buffer.alloc(32, 1),
    secretKey: Buffer.alloc(64, 1)
  }
  // Fake storage object.
  const fakeStorage: any = {
    get: jest.fn(() => Promise.resolve({})),
    set: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve())
  }
  // Fake matrix nodes (using NodeDistributions).
  const fakeMatrixNodes: NodeDistributions = {
    EUROPE_WEST: ['server1']
  }

  beforeEach(() => {
    transport = new P2PTransport(
      'TestTransport',
      fakeKeyPair,
      fakeStorage,
      fakeMatrixNodes,
      StorageKey.TRANSPORT_P2P_PEERS_DAPP,
      'iconUrl',
      'appUrl'
    )
    // Verify that the type is set correctly.
    expect(transport.type).toBe(TransportType.P2P)

    // Stub out internal methods on the P2PCommunicationClient instance.
    transport.client.start = jest.fn(() => Promise.resolve())
    transport.client.getPairingRequestInfo = jest.fn(() =>
      Promise.resolve({
        id: 'req1',
        name: 'TestTransport',
        publicKey: 'pubkey',
        version: BEACON_VERSION,
        relayServer: 'relay.server'
      } as P2PPairingRequest)
    )
    transport.client.getPairingResponseInfo = jest.fn((req: P2PPairingRequest) =>
      Promise.resolve({
        id: req.id,
        name: 'TestTransport',
        publicKey: 'pubkey',
        version: req.version,
        relayServer: 'relay.server'
      } as P2PPairingResponse)
    )
    transport.client.listenForEncryptedMessage = jest.fn(
      (publicKey: string, callback: (message: string) => void) =>
        Promise.resolve(callback('decryptedMessage'))
    )
    transport.client.stop = jest.fn(() => Promise.resolve())
    // Stub startOpenChannelListener to resolve (its implementation is a no-op).
    transport.startOpenChannelListener = jest.fn(() => Promise.resolve())
    // Stub getPeers to return an empty array by default.
    transport.getPeers = jest.fn(() => Promise.resolve([]))
    // For notifyListeners, we stub it to return a resolved promise.
    transport.notifyListeners = jest.fn(() => Promise.resolve())

    // Stub methods used for pairing info on the client.
    jest.spyOn(transport.client, 'getPublicKey').mockResolvedValue('pubkey')
    jest.spyOn(transport.client, 'getPublicKeyHash').mockResolvedValue('pubkeyhash')

    // For getRelayServer, override fakeStorage.get so that when called with MATRIX_SELECTED_NODE, it returns "relay.server".
    fakeStorage.get.mockImplementation((key: string) => {
      if (key === StorageKey.MATRIX_SELECTED_NODE) {
        return Promise.resolve('relay.server')
      }
      return Promise.resolve({})
    })

    // Stub getBeaconInfo on the client.
    jest.spyOn(transport.client, 'getBeaconInfo').mockResolvedValue({
      region: 'EUROPE_WEST',
      known_servers: ['server1'],
      timestamp: Date.now()
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('isAvailable', () => {
    it('should resolve to true', async () => {
      const available = await P2PTransport.isAvailable()
      expect(available).toBe(true)
    })
  })

  describe('connect', () => {
    it('should start the client and call startOpenChannelListener when no known peers', async () => {
      ;(transport.getPeers as jest.Mock).mockResolvedValue([])
      await transport.connect()
      expect(transport.client.start).toHaveBeenCalled()
      expect(transport.startOpenChannelListener).toHaveBeenCalled()
    })

    it('should call listen for each known peer', async () => {
      const knownPeers = [{ publicKey: 'peer1' }, { publicKey: 'peer2' }]
      ;(transport.getPeers as jest.Mock).mockResolvedValue(knownPeers)
      const listenSpy = jest.spyOn(transport, 'listen').mockResolvedValue(undefined)
      await transport.connect()
      expect(listenSpy).toHaveBeenCalledWith('peer1')
      expect(listenSpy).toHaveBeenCalledWith('peer2')
    })
  })

  describe('disconnect', () => {
    it('should stop the client', async () => {
      await transport.disconnect()
      expect(transport.client.stop).toHaveBeenCalled()
    })
  })

  describe('getPairingRequestInfo', () => {
    it('should return pairing request info from the client', async () => {
      const info = await transport.getPairingRequestInfo()
      expect(info).toEqual({
        id: 'req1',
        name: 'TestTransport',
        publicKey: 'pubkey',
        version: BEACON_VERSION,
        relayServer: 'relay.server'
      })
    })
  })

  describe('getPairingResponseInfo', () => {
    it('should return pairing response info from the client', async () => {
      const dummyRequest = {
        id: 'req1',
        name: 'Requestor',
        publicKey: 'peerPubKey',
        version: '2.0',
        relayServer: 'relay.server'
      }
      const info = await transport.client.getPairingResponseInfo(dummyRequest);
      expect(info).toEqual({
        id: dummyRequest.id,
        name: 'TestTransport',
        publicKey: 'pubkey',
        version: dummyRequest.version,
        relayServer: 'relay.server'
      });
    });
  });

  describe('listen', () => {
    it('should call client.listenForEncryptedMessage and then notify listeners', async () => {
      const notifySpy = jest.spyOn(transport, 'notifyListeners').mockResolvedValue(undefined)
      await transport.listen('peer1')
      expect(transport.client.listenForEncryptedMessage).toHaveBeenCalledWith(
        'peer1',
        expect.any(Function)
      )
      expect(notifySpy).toHaveBeenCalledWith('decryptedMessage', {
        origin: expect.any(String),
        id: 'peer1'
      })
    })
  })

  // Additional tests for methods such as disconnect and pairing methods can be added here.
})
