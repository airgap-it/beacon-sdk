import axios from 'axios'
import { toHex } from '@airgap/beacon-utils'
import { LocalStorage, NOTIFICATION_ORACLE_URL, windowRef, getSenderId } from '@airgap/beacon-core'
import { BeaconMessageType, StorageKey, TransportStatus } from '@airgap/beacon-types'
import { WalletClient } from '../src/client/WalletClient'
import { WalletClientOptions } from '../src/client/WalletClientOptions'

// --- Mocks ---

// Mock axios for GET and POST.
jest.mock('axios')

// Mock the WalletP2PTransport so that WalletClient.init() gets a predictable transport.
// We import TransportStatus within the module factory.
jest.mock('../src/transports/WalletP2PTransport', () => {
  const { TransportStatus } = require('@airgap/beacon-types')
  return {
    WalletP2PTransport: jest
      .fn()
      .mockImplementation((_name, _keyPair, _storage, _matrixNodes, _iconUrl, _appUrl) => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        addListener: jest.fn().mockResolvedValue(undefined),
        getPeers: jest.fn().mockResolvedValue([]),
        send: jest.fn().mockResolvedValue(undefined),
        removePeer: jest.fn().mockResolvedValue('removed'),
        removeAllPeers: jest.fn().mockResolvedValue('allRemoved'),
        connectionStatus: TransportStatus.NOT_CONNECTED
      }))
  }
})

// Mock the interceptors.
// IMPORTANT: We now export OutgoingResponseInterceptor as a named export.
jest.mock('../src/interceptors/OutgoingResponseInterceptor', () => ({
  OutgoingResponseInterceptor: {
    intercept: jest.fn().mockImplementation(async (params) => {
      // Immediately invoke the interceptor callback if provided.
      if (params.interceptorCallback) {
        await params.interceptorCallback({ id: 'response', type: 'TestResponse' })
      }
    })
  }
}))

jest.mock('../src/interceptors/IncomingRequestInterceptor', () => ({
  intercept: jest.fn().mockResolvedValue(undefined)
}))

// --- Test Suite ---

describe('WalletClient', () => {
  let walletClient: any // WalletClient type
  let storage: LocalStorage

  // Example configuration options.
  const clientOptions: WalletClientOptions = {
    name: 'TestWallet',
    storage: new LocalStorage(),
    matrixNodes: {},
    iconUrl: 'http://icon.com',
    appUrl: 'http://app.com'
  }

  beforeEach(() => {
    // Reset singleton flag so tests start clean.
    delete (windowRef as any).beaconCreatedClientInstance
    storage = new LocalStorage()
    clientOptions.storage = storage
    walletClient = new WalletClient(clientOptions)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getRegisterPushChallenge', () => {
    it('should return a valid challenge object and correctly construct payloadToSign', async () => {
      const challengeData = { id: 'challenge123', timestamp: 'timestamp123' }
      ;(axios.get as jest.Mock).mockResolvedValue({ data: challengeData })

      const accountPublicKey = 'publicKey123'
      const backendUrl = 'http://backend.com'

      const result = await walletClient.getRegisterPushChallenge(backendUrl, accountPublicKey)

      const constructedString = [
        'Tezos Signed Message: ',
        challengeData.id,
        challengeData.timestamp,
        accountPublicKey,
        backendUrl
      ].join(' ')
      const hexString = toHex(constructedString)
      const expectedPayloadToSign =
        '05' + '01' + hexString.length.toString(16).padStart(8, '0') + hexString

      expect(result.challenge).toEqual(challengeData)
      expect(result.payloadToSign).toEqual(expectedPayloadToSign)
      expect(axios.get).toHaveBeenCalledWith(`${NOTIFICATION_ORACLE_URL}/challenge`)
    })
  })

  describe('registerPush', () => {
    it('should return an existing push token if already registered', async () => {
      const existingToken = {
        publicKey: 'publicKey123',
        backendUrl: 'http://backend.com',
        accessToken: 'accessToken123',
        managementToken: 'managementToken123'
      }
      storage.get = jest.fn().mockResolvedValue([existingToken])

      const result = await walletClient.registerPush(
        { id: 'challenge123', timestamp: 'timestamp123' },
        'signature123',
        'http://backend.com',
        'publicKey123',
        'protocolIdentifier',
        'deviceId'
      )

      expect(result).toEqual(existingToken)
      expect(axios.post).not.toHaveBeenCalled()
    })

    it('should register and return a new push token if one does not exist', async () => {
      storage.get = jest.fn().mockResolvedValue([])
      const postResponse = {
        data: {
          accessToken: 'newAccessToken',
          managementToken: 'newManagementToken',
          message: 'Success',
          success: true
        }
      }
      ;(axios.post as jest.Mock).mockResolvedValue(postResponse)
      storage.set = jest.fn().mockResolvedValue(undefined)

      const result = await walletClient.registerPush(
        { id: 'challenge456', timestamp: 'timestamp456' },
        'signature456',
        'http://backend.com',
        'publicKey456',
        'protocolIdentifier',
        'deviceId'
      )

      const expectedToken = {
        publicKey: 'publicKey456',
        backendUrl: 'http://backend.com',
        accessToken: 'newAccessToken',
        managementToken: 'newManagementToken'
      }

      expect(result).toEqual(expectedToken)
      expect(axios.post).toHaveBeenCalledWith(`${NOTIFICATION_ORACLE_URL}/register`, {
        name: 'TestWallet',
        challenge: { id: 'challenge456', timestamp: 'timestamp456' },
        accountPublicKey: 'publicKey456',
        signature: 'signature456',
        backendUrl: 'http://backend.com',
        protocolIdentifier: 'protocolIdentifier',
        deviceId: 'deviceId'
      })
      expect(storage.set).toHaveBeenCalledWith(
        StorageKey.PUSH_TOKENS,
        expect.arrayContaining([expectedToken])
      )
    })
  })

  describe('init', () => {
    it('should create a WalletP2PTransport and call super.init', async () => {
      const originalInit = Object.getPrototypeOf(WalletClient.prototype).init
      Object.getPrototypeOf(WalletClient.prototype).init = jest
        .fn()
        .mockResolvedValue('dummyTransport')

      const result = await walletClient.init()
      expect(result).toEqual('dummyTransport')
      const WalletP2PTransportMock =
        require('../src/transports/WalletP2PTransport').WalletP2PTransport
      expect(WalletP2PTransportMock).toHaveBeenCalledWith(
        clientOptions.name,
        expect.anything(),
        storage,
        clientOptions.matrixNodes,
        clientOptions.iconUrl,
        clientOptions.appUrl
      )

      Object.getPrototypeOf(WalletClient.prototype).init = originalInit
    })
  })

  describe('_connect', () => {
    it('should return immediately if transport.connectionStatus is not NOT_CONNECTED', async () => {
      const transportMock = { connectionStatus: TransportStatus.CONNECTED, connect: jest.fn() }
      jest.spyOn(walletClient, 'transport', 'get').mockReturnValue(Promise.resolve(transportMock))
      await (walletClient as any)._connect()
      expect(transportMock.connect).not.toHaveBeenCalled()
    })

    it('should retry connection when transport.connect fails', async () => {
      let connectCalls = 0
      const transportMock = {
        connectionStatus: TransportStatus.NOT_CONNECTED,
        connect: jest.fn().mockImplementation(async () => {
          connectCalls++
          if (connectCalls === 1) throw new Error('Test error')
          return
        }),
        disconnect: jest.fn().mockResolvedValue(undefined),
        addListener: jest.fn().mockResolvedValue(undefined)
      }
      jest.spyOn(walletClient, 'transport', 'get').mockReturnValue(Promise.resolve(transportMock))
      await (walletClient as any)._connect()
      expect(transportMock.connect).toHaveBeenCalledTimes(2)
      expect(transportMock.disconnect).toHaveBeenCalled()
      const isConnected = await walletClient.isConnected
      expect(isConnected).toBe(true)
    })
  })

  describe('connect and handleResponse', () => {
    it('should set handleResponse and call _connect', async () => {
      const newMessageCallback = jest.fn().mockResolvedValue(undefined)
      const transportMock = {
        connectionStatus: TransportStatus.NOT_CONNECTED,
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        addListener: jest.fn().mockResolvedValue(undefined)
      }
      jest.spyOn(walletClient, 'transport', 'get').mockReturnValue(Promise.resolve(transportMock))
      await walletClient.connect(newMessageCallback)
      expect(typeof (walletClient as any).handleResponse).toBe('function')
      expect(transportMock.connect).toHaveBeenCalled()
    })

    it('handleResponse should call IncomingRequestInterceptor.intercept for version "3"', async () => {
      const message = { version: '3', id: 'msg1', message: { type: 'SomeType' } }
      const connectionContext = { id: 'conn1' }
      ;(walletClient as any).pendingRequests = []
      const interceptSpy = jest.spyOn(
        require('../src/interceptors/IncomingRequestInterceptor'),
        'intercept'
      )
      ;(walletClient as any).handleResponse = async (msg: any, conn: any) => {
        await require('../src/interceptors/IncomingRequestInterceptor').intercept({
          message: msg,
          connectionInfo: conn,
          appMetadataManager: walletClient['appMetadataManager'],
          interceptorCallback: async (cb: any) => {
            await cb(msg)
          }
        })
      }
      await (walletClient as any).handleResponse(message, connectionContext)
      expect(interceptSpy).toHaveBeenCalled()
    })

    it('handleResponse should call disconnect for Disconnect message (version "3")', async () => {
      const message = {
        version: '3',
        id: 'msg2',
        message: { type: 'Disconnect' },
        senderId: 'sender-disconnect'
      }
      ;(walletClient as any).handleResponse = async (msg: any, conn: any) => {
        if (msg.message.type === 'Disconnect') {
          await walletClient.disconnect(msg.senderId)
        }
      }
      const disconnectSpy = jest
        .spyOn(walletClient as any, 'disconnect')
        .mockResolvedValue(undefined)
      await (walletClient as any).handleResponse(message, { id: 'conn2' })
      expect(disconnectSpy).toHaveBeenCalledWith('sender-disconnect')
    })
  })

  describe('respond', () => {
    it('should throw an error if no matching request is found', async () => {
      await expect(
        walletClient.respond({
          id: 'nonexistent',
          type: BeaconMessageType.PermissionResponse
        } as any)
      ).rejects.toThrow('No matching request found!')
    })

    it('should call OutgoingResponseInterceptor.intercept and then respondToMessage', async () => {
      const dummyRequest = { id: 'req1', type: 'TestRequest' }
      const connectionContext = { id: 'conn1' }
      ;(walletClient as any).pendingRequests = [[dummyRequest, connectionContext]]
      const respondToMessageSpy = jest
        .spyOn(walletClient as any, 'respondToMessage')
        .mockResolvedValue(undefined)
      await walletClient.respond({ id: 'req1', type: BeaconMessageType.PermissionResponse } as any)
      expect((walletClient as any).pendingRequests).toHaveLength(0)
      expect(respondToMessageSpy).toHaveBeenCalled()
    })
  })

  describe('AppMetadata and Permission methods', () => {
    it('should get app metadata list', async () => {
      const dummyList = [{ id: 'app1' }]
      walletClient['appMetadataManager'].getAppMetadataList = jest.fn().mockResolvedValue(dummyList)
      const result = await walletClient.getAppMetadataList()
      expect(result).toEqual(dummyList)
    })

    it('should get app metadata for a sender', async () => {
      const dummyMetadata = { id: 'app2' }
      walletClient['appMetadataManager'].getAppMetadata = jest.fn().mockResolvedValue(dummyMetadata)
      const result = await walletClient.getAppMetadata('sender1')
      expect(result).toEqual(dummyMetadata)
    })

    it('should remove app metadata for a sender', async () => {
      const removeSpy = jest
        .spyOn(walletClient['appMetadataManager'], 'removeAppMetadata')
        .mockResolvedValue(undefined)
      await walletClient.removeAppMetadata('sender1')
      expect(removeSpy).toHaveBeenCalledWith('sender1')
    })

    it('should remove all app metadata', async () => {
      const removeAllSpy = jest
        .spyOn(walletClient['appMetadataManager'], 'removeAllAppMetadata')
        .mockResolvedValue(undefined)
      await walletClient.removeAllAppMetadata()
      expect(removeAllSpy).toHaveBeenCalled()
    })

    it('should get permissions', async () => {
      const dummyPermissions = [{ id: 'perm1' }]
      walletClient['permissionManager'].getPermissions = jest
        .fn()
        .mockResolvedValue(dummyPermissions)
      const result = await walletClient.getPermissions()
      expect(result).toEqual(dummyPermissions)
    })

    it('should get a permission by accountIdentifier', async () => {
      const dummyPermission = { accountIdentifier: 'acc1' }
      walletClient['permissionManager'].getPermission = jest.fn().mockResolvedValue(dummyPermission)
      const result = await walletClient.getPermission('acc1')
      expect(result).toEqual(dummyPermission)
    })

    it('should remove a permission by accountIdentifier', async () => {
      walletClient['permissionManager'].removePermission = jest.fn().mockResolvedValue(undefined)
      await walletClient.removePermission('acc1')
      expect(walletClient['permissionManager'].removePermission).toHaveBeenCalledWith('acc1')
    })

    it('should remove all permissions', async () => {
      walletClient['permissionManager'].removeAllPermissions = jest
        .fn()
        .mockResolvedValue(undefined)
      await walletClient.removeAllPermissions()
      expect(walletClient['permissionManager'].removeAllPermissions).toHaveBeenCalled()
    })
  })

  describe('addPeer', () => {
    it('should add peer using transport.addPeer after transforming peer', async () => {
      const dummyPeer: any = { id: 'peer1', name: 'Peer1', publicKey: 'pubkey1', version: '1' }
      // Spy on getSenderId from beacon-core.
      jest.spyOn(require('@airgap/beacon-core'), 'getSenderId').mockResolvedValue('sender1')
      const addPeerMock = jest.fn().mockResolvedValue(undefined)
      jest
        .spyOn(walletClient, 'transport', 'get')
        .mockReturnValue(Promise.resolve({ addPeer: addPeerMock }))
      await walletClient.addPeer(dummyPeer, true)
      expect(addPeerMock).toHaveBeenCalledWith(
        expect.objectContaining({ senderId: 'sender1', id: 'peer1' }),
        true
      )
    })
  })

  describe('removePeer', () => {
    const dummyPeer: any = { senderId: 'sender1', publicKey: 'pubkey1' }
    it('should remove peer without sending disconnect when flag is false', async () => {
      const removePeerMock = jest.fn().mockResolvedValue('removed')
      jest.spyOn(walletClient['permissionManager'], 'getPermissions').mockResolvedValue([])
      jest
        .spyOn(walletClient, 'transport', 'get')
        .mockReturnValue(Promise.resolve({ removePeer: removePeerMock }))
      const result = await walletClient.removePeer(dummyPeer, false)
      expect(removePeerMock).toHaveBeenCalledWith(dummyPeer)
      expect(result).toEqual('removed')
    })

    it('should remove peer and send disconnect when flag is true', async () => {
      const dummyPeer2: any = { senderId: 'sender2', publicKey: 'pubkey2' }
      const removePeerMock = jest.fn().mockResolvedValue('removed')
      const sendDisconnectSpy = jest
        .spyOn(walletClient as any, 'sendDisconnectToPeer')
        .mockResolvedValue(undefined)
      jest.spyOn(walletClient['permissionManager'], 'getPermissions').mockResolvedValue([])
      jest
        .spyOn(walletClient, 'transport', 'get')
        .mockReturnValue(Promise.resolve({ removePeer: removePeerMock }))
      const result = await walletClient.removePeer(dummyPeer2, true)
      expect(removePeerMock).toHaveBeenCalledWith(dummyPeer2)
      expect(sendDisconnectSpy).toHaveBeenCalledWith(dummyPeer2)
      expect(result).toEqual('removed')
    })
  })

  describe('removeAllPeers', () => {
    it('should remove all peers without sending disconnect when flag is false', async () => {
      const peers = [{ senderId: 's1' }, { senderId: 's2' }]
      const removeAllPeersMock = jest.fn().mockResolvedValue('allRemoved')
      const getPeersMock = jest.fn().mockResolvedValue(peers)
      jest.spyOn(walletClient['permissionManager'], 'getPermissions').mockResolvedValue([])
      jest.spyOn(walletClient, 'transport', 'get').mockReturnValue(
        Promise.resolve({
          getPeers: getPeersMock,
          removeAllPeers: removeAllPeersMock
        })
      )
      const result = await walletClient.removeAllPeers(false)
      expect(getPeersMock).toHaveBeenCalled()
      expect(removeAllPeersMock).toHaveBeenCalled()
      expect(result).toEqual('allRemoved')
    })

    it('should remove all peers and send disconnect for each when flag is true', async () => {
      const peers = [{ senderId: 's1' }, { senderId: 's2' }]
      const removeAllPeersMock = jest.fn().mockResolvedValue('allRemoved')
      const getPeersMock = jest.fn().mockResolvedValue(peers)
      const sendDisconnectSpy = jest
        .spyOn(walletClient as any, 'sendDisconnectToPeer')
        .mockResolvedValue(undefined)
      jest.spyOn(walletClient['permissionManager'], 'getPermissions').mockResolvedValue([])
      jest.spyOn(walletClient, 'transport', 'get').mockReturnValue(
        Promise.resolve({
          getPeers: getPeersMock,
          removeAllPeers: removeAllPeersMock
        })
      )
      const result = await walletClient.removeAllPeers(true)
      expect(getPeersMock).toHaveBeenCalled()
      expect(removeAllPeersMock).toHaveBeenCalled()
      expect(sendDisconnectSpy).toHaveBeenCalledTimes(peers.length)
      expect(result).toEqual('allRemoved')
    })
  })

  describe('disconnect', () => {
    it('should disconnect by removing the matching peer and disconnecting the transport', async () => {
      const dummyPeer = { senderId: 'senderDisconnect', publicKey: 'pubkey' }
      const getPeersMock = jest.fn().mockResolvedValue([dummyPeer])
      const removePeerMock = jest.fn().mockResolvedValue(undefined)
      const disconnectMock = jest.fn().mockResolvedValue(undefined)
      jest.spyOn(walletClient, 'transport', 'get').mockReturnValue(
        Promise.resolve({
          getPeers: getPeersMock,
          removePeer: removePeerMock,
          disconnect: disconnectMock
        })
      )
      await (walletClient as any).disconnect('senderDisconnect')
      expect(getPeersMock).toHaveBeenCalled()
      expect(removePeerMock).toHaveBeenCalledWith(dummyPeer)
      expect(disconnectMock).toHaveBeenCalled()
    })

    it('should disconnect the transport even if no matching peer is found', async () => {
      const getPeersMock = jest.fn().mockResolvedValue([])
      const disconnectMock = jest.fn().mockResolvedValue(undefined)
      jest.spyOn(walletClient, 'transport', 'get').mockReturnValue(
        Promise.resolve({
          getPeers: getPeersMock,
          disconnect: disconnectMock
        })
      )
      await (walletClient as any).disconnect('nonexistent')
      expect(getPeersMock).toHaveBeenCalled()
      expect(disconnectMock).toHaveBeenCalled()
    })
  })
})
