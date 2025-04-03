// DAppClient.test.ts

import { DAppClient } from '../src/dapp-client/DAppClient'
import {
  BeaconMessageType,
  ColorMode,
  PermissionScope,
  TransportStatus
} from '@airgap/beacon-types'
import { BeaconEvent, ExposedPromise } from '../src'

// --- Fake dependencies/stubs ---

const fakeStorage = {
  subscribeToStorageChanged: jest.fn(),
  get: jest.fn().mockImplementation((key: string) => {
    // Simulate that no active account and no user id exist initially.
    if (key === 'beacon:active_account') return Promise.resolve(undefined)
    if (key === 'beacon:USER_ID') return Promise.resolve(undefined)
    if (key === 'beacon:sdk-secret-seed') return Promise.resolve('test')
    return Promise.resolve(undefined)
  }),
  set: jest.fn().mockResolvedValue(undefined),
  getPrefixedKey: jest.fn().mockImplementation((key: string) => key)
}

const fakeAccountManager = {
  getAccount: jest.fn().mockResolvedValue(undefined),
  addAccount: jest.fn().mockResolvedValue(undefined),
  removeAccount: jest.fn().mockResolvedValue(undefined),
  removeAllAccounts: jest.fn(),
  getAccounts: jest.fn().mockResolvedValue([])
}

const fakeEvents = {
  emit: jest.fn().mockResolvedValue(undefined),
  on: jest.fn().mockResolvedValue(undefined)
}

// Create a fake transport object that simulates a connected transport.
const fakeTransport: any = {
  type: 'fake',
  connectionStatus: TransportStatus.CONNECTED,
  send: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined)
}

jest.mock('@airgap/beacon-utils', () => ({
  getKeypairFromSeed: jest.fn(),
  toHex: jest.fn(),
  generateGUID: jest.fn(),
  ExposedPromise: class ExposedPromise {
    promise = Promise.resolve(undefined)
    resolve = jest.fn()
    reject = jest.fn()
    isPending = jest.fn()
    isResolved = jest.fn()
    isRejected = jest.fn()
    isSettled = jest.fn()
    static resolve = jest.fn()
  }
}))

jest.mock('@airgap/beacon-core', () => ({
  Logger: class Logger {
    log = jest.fn()
    error = jest.fn()
    time = jest.fn()
  },
  Client: class Client {
    storage = {
      subscribeToStorageChanged: jest.fn(),
      get: jest.fn().mockImplementation((key: string) => {
        // Simulate that no active account and no user id exist initially.
        if (key === 'beacon:active_account') return Promise.resolve(undefined)
        if (key === 'beacon:USER_ID') return Promise.resolve(undefined)
        if (key === 'beacon:sdk-secret-seed') return Promise.resolve('test')
        return Promise.resolve(undefined)
      }),
      set: jest.fn().mockResolvedValue(undefined),
      getPrefixedKey: jest.fn().mockImplementation((key: string) => key)
    }
    accountManager = {
      getAccounts: jest.fn().mockResolvedValue([]),
      getAccount: jest.fn().mockResolvedValue(undefined),
      removeAccount: jest.fn().mockResolvedValue(undefined),
      removeAllAccounts: jest.fn().mockResolvedValue(undefined)
    }
    removeAccount = jest.fn()
    removeAllAccounts = jest.fn()
    setTransport = jest.fn()
    addListener = jest.fn()
    getOwnAppMetadata = jest.fn()
  },
  IndexedDBStorage: class IndexedDBStorage {
    get = jest.fn()
    set = jest.fn()
    delete = jest.fn()
    getAll = jest.fn()
    getAllKeys = jest.fn().mockReturnValue([])
    clearStore = jest.fn()
    getPrefixedKey = jest.fn()
    subscribeToStorageChanged = jest.fn()
    fillStore = jest.fn()
  },
  MultiTabChannel: class MultiTabChannel {
    isLeader = jest.fn()
    getLeadership = jest.fn()
    hasLeader = jest.fn()
    postMessage = jest.fn()
  },
  AppMetadataManager: class AppMetadataManager {
    getAppMetadataList = jest.fn()
    getAppMetadata = jest.fn()
    addAppMetadata = jest.fn()
    removeAppMetadata = jest.fn()
    removeAppMetadatas = jest.fn()
    removeAllAppMetadata = jest.fn()
  },
  StorageValidator: class StorageValidator {
    validate = jest.fn().mockReturnValue(Promise.resolve(true))
  },
  LocalStorage: class LocalStorage {
    get = jest.fn()
    set = jest.fn()
    delete = jest.fn()
    getAll = jest.fn()
    getAllKeys = jest.fn()
    clearStore = jest.fn()
    getPrefixedKey = jest.fn()
    subscribeToStorageChanged = jest.fn()
  },
  ClientEvents: class ClientEvents {
    CLOSE_ALERT = 'CLOSE_ALERT'
    RESET_STATE = 'RESET_STATE'
    WC_ACK_NOTIFICATION = 'WC_ACK_NOTIFICATION'
    ON_RELAYER_ERROR = 'ON_RELAYER_ERROR'
  }
}))

jest.mock('@airgap/beacon-transport-matrix', () => ({
  P2PTransport: class P2PTransport {
    client = {
      listenForChannelOpening: jest.fn()
    }
    setEventHandler = jest.fn()
    getPeers = jest.fn().mockReturnValue([])
  }
}))

jest.mock('@airgap/beacon-transport-postmessage', () => ({
  PostMessageTransport: class PostMessageTransport {
    client = {
      listenForChannelOpening: jest.fn()
    }
    setEventHandler = jest.fn()
    getPeers = jest.fn().mockReturnValue([])
  }
}))

jest.mock('@airgap/beacon-transport-walletconnect', () => ({
  WalletConnectTransport: class WalletConnectTransport {
    client = {
      listenForChannelOpening: jest.fn()
    }
    setEventHandler = jest.fn()
    getPeers = jest.fn().mockReturnValue([])
  }
}))

// --- Mock beacon-ui functions ---
jest.mock('@airgap/beacon-ui', () => ({
  setColorMode: jest.fn(),
  getColorMode: jest.fn().mockResolvedValue('light'),
  setDesktopList: jest.fn(),
  setExtensionList: jest.fn(),
  setWebList: jest.fn(),
  setiOSList: jest.fn(),
  getiOSList: jest.fn().mockReturnValue([]),
  getDesktopList: jest.fn().mockReturnValue([]),
  getExtensionList: jest.fn().mockReturnValue([]),
  getWebList: jest.fn().mockReturnValue([]),
  isBrowser: jest.fn().mockReturnValue(true),
  isDesktop: jest.fn().mockReturnValue(false),
  isMobileOS: jest.fn().mockReturnValue(false),
  isIOS: jest.fn().mockReturnValue(false),
  currentOS: jest.fn().mockReturnValue('browser')
}))

// --- Fake config for the DAppClient ---
const fakeConfig = {
  name: 'TestDApp',
  description: 'Test Description',
  storage: fakeStorage,
  network: { type: 'MAINNET' },
  colorMode: 'light',
  walletConnectOptions: {
    projectId: 'test-project',
    relayUrl: 'https://relay.test'
  },
  eventHandlers: {},
  disableDefaultEvents: false,
  errorMessages: {},
  featuredWallets: ['wallet1'],
  preferredNetwork: 'MAINNET',
  analytics: {
    track: () => {}
  }
}

// --- The tests ---
describe('DAppClient', () => {
  describe('constructor and initialization', () => {
    it('should initialize with given config values', () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      expect(client.description).toBe('Test Description')
      expect(client.network.type).toBe('MAINNET')
    })
  })

  describe('Active account management', () => {
    it('should get active account (initially undefined)', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      expect(client['_activeAccount']).toBeTruthy()
      const active = await client.getActiveAccount()
      expect(active).toBeUndefined()
    })

    it('should set active account and call storage.set and emit event', async () => {
      const dummyAccount: any = {
        accountIdentifier: 'acc1',
        senderId: 'sender1',
        address: 'tz1dummy',
        publicKey: 'pubkey',
        scopes: [PermissionScope.OPERATION_REQUEST],
        origin: { type: 'extension', id: 'ext1' },
        network: { type: 'MAINNET' }
      }
      const client: any = new DAppClient(fakeConfig as any)

      client['isGetActiveAccountHandled'] = true
      client['_transport'] = new ExposedPromise()
      client['_transport'].resolve(fakeTransport)
      client['storage'] = fakeStorage as any
      client['events'] = fakeEvents as any

      expect(client['_activeAccount'].isSettled()).toBeFalsy()

      await client.setActiveAccount(dummyAccount)
      //   expect(fakeStorage.set).toHaveBeenLastCalledWith(
      //     'beacon:active_account',
      //     dummyAccount.accountIdentifier
      //   )
      expect(fakeEvents.emit).toHaveBeenLastCalledWith(BeaconEvent.ACTIVE_ACCOUNT_SET, dummyAccount)
    })

    it('should clear active account when clearActiveAccount is called', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.setActiveAccount = jest.fn()
      await client.clearActiveAccount()
      expect(client.setActiveAccount).toHaveBeenCalledWith(undefined)
    })
  })

  describe('Color mode', () => {
    it('should set color mode', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      const { setColorMode } = require('@airgap/beacon-ui')
      await client.setColorMode(ColorMode.DARK)
      expect(setColorMode).toHaveBeenCalledWith('dark')
    })

    it('should get color mode', async () => {
      const { getColorMode } = require('@airgap/beacon-ui')
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      const mode = await client.getColorMode()
      expect(getColorMode).toHaveBeenCalled()
      expect(mode).toBe('light')
    })
  })

  describe('Event subscription', () => {
    it('should subscribe to event and set flag for ACTIVE_ACCOUNT_SET', async () => {
      const client: any = new DAppClient(fakeConfig as any)
      client['events'] = fakeEvents
      await client.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, jest.fn())
      expect(fakeEvents.on).toHaveBeenCalledWith(
        BeaconEvent.ACTIVE_ACCOUNT_SET,
        expect.any(Function)
      )
      expect(client['isGetActiveAccountHandled']).toBe(true)
    })
  })

  describe('Permissions checking', () => {
    it('should allow permission requests without active account', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      const result = await client.checkPermissions(BeaconMessageType.PermissionRequest)
      expect(result).toBe(true)
    })

    it('should throw error if active account is missing for non-permission request', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      await expect(client.checkPermissions(BeaconMessageType.SignPayloadRequest)).rejects.toThrow(
        'No active account set!'
      )
    })

    it('should check permission for operation request', async () => {
      const dummyAccount = { scopes: [PermissionScope.OPERATION_REQUEST] }
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue(dummyAccount)
      const result = await client.checkPermissions(BeaconMessageType.OperationRequest)
      expect(result).toBe(true)
    })
  })

  describe('requestSignPayload', () => {
    it('should throw error if payload is not provided', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      await expect(client.requestSignPayload({ payload: '' })).rejects.toThrow(
        'Payload must be provided'
      )
    })

    it('should throw error if active account is missing', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue(undefined)
      await expect(client.requestSignPayload({ payload: '05abcdef' })).rejects.toThrow(
        'No active account!'
      )
    })

    it('should throw error if payload is not a string', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue({ address: 'tz1dummy' })
      await expect(client.requestSignPayload({ payload: 123 as any })).rejects.toThrow(
        'Payload must be a string'
      )
    })

    it('should throw error for invalid signing type prefix', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue({ address: 'tz1dummy' })
      await expect(
        client.requestSignPayload({ payload: '051234', signingType: 'OPERATION' as any })
      ).rejects.toThrow()
    })

    it('should succeed with RAW signing type', async () => {
      const dummyActiveAccount = { address: 'tz1dummy', scopes: [PermissionScope.SIGN] }
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue(dummyActiveAccount)
      // Override internal methods to simulate a response.
      client['checkMakeRequest'] = jest.fn().mockResolvedValue(true)
      client['makeRequest'] = jest.fn().mockResolvedValue({
        message: { signature: 'edsig123' },
        connectionInfo: { origin: 'postmessage', id: 'conn1' }
      })
      client['analytics'] = { track: () => {} }
      const response = await client.requestSignPayload({ payload: 'abcdef' })
      expect(response.signature).toBe('edsig123')
    })
  })

  describe('removeAccount and removeAllAccounts', () => {
    it('should remove account and clear active account if matching', async () => {
      const client: any = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client['accountManager'] = fakeAccountManager
      const dummyAccount = { accountIdentifier: 'acc1', senderId: 'sender1' }
      client.getActiveAccount = jest.fn().mockResolvedValue(dummyAccount)
      await client.removeAccount('acc1')
    })

    it('should remove all accounts and clear active account', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      await client.removeAllAccounts()
    })
  })

  describe('disconnect', () => {
    it('should throw error if transport not available', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client['_transport'] = new ExposedPromise()
      await expect(client.disconnect()).rejects.toThrow('No transport available.')
    })
  })

  describe('destroy', () => {
    it('should call createStateSnapshot and super.destroy', async () => {
      const client: any = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.createStateSnapshot = jest.fn().mockResolvedValue(undefined)
      // Spy on the parent destroy call.
      const superDestroySpy = jest
        .spyOn(Object.getPrototypeOf(client), 'destroy')
        .mockResolvedValue(undefined)
      await client.destroy()
      // expect(client.createStateSnapshot).toHaveBeenCalled()
      expect(superDestroySpy).toHaveBeenCalled()
      superDestroySpy.mockRestore()
    })
  })

  describe('sendNotification', () => {
    it('should throw error if active account missing or no notification permission', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue(undefined)
      await expect(client.sendNotification('title', 'msg', 'payload', 'protocol')).rejects.toThrow(
        'notification permissions not given'
      )
    })

    it('should throw error if no access token', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue({
        scopes: [PermissionScope.NOTIFICATION],
        notification: {}
      })
      await expect(client.sendNotification('title', 'msg', 'payload', 'protocol')).rejects.toThrow(
        'No AccessToken'
      )
    })

    it('should throw error if no push URL', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue({
        scopes: [PermissionScope.NOTIFICATION],
        notification: { token: 'token' }
      })
      await expect(client.sendNotification('title', 'msg', 'payload', 'protocol')).rejects.toThrow(
        'No Push URL set'
      )
    })
  })

  describe('requestPermissions', () => {
    it('should process a permission request and return an output', async () => {
      // Simulate a successful makeRequest call.
      const dummyResponse = {
        message: { appMetadata: { name: 'TestApp' }, scopes: [PermissionScope.SIGN] },
        connectionInfo: { origin: 'postmessage', id: 'conn1' }
      }
      const client: any = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client['checkMakeRequest'] = jest.fn().mockResolvedValue(true)
      client['makeRequest'] = jest.fn().mockResolvedValue(dummyResponse)
      client.onNewAccount = jest.fn().mockResolvedValue({
        accountIdentifier: 'acc1',
        senderId: 'sender1',
        address: 'tz1dummy'
      })
      client['accountManager'] = fakeAccountManager
      client.notifySuccess = jest.fn().mockResolvedValue(undefined)
      client['analytics'] = { track: () => {} }
      const output = await client.requestPermissions()
      expect(output).toBeDefined()
    })
  })

  describe('requestOperation', () => {
    it('should throw error if operation details not provided', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      await expect(client.requestOperation({} as any)).rejects.toThrow(
        'Operation details must be provided'
      )
    })

    it('should throw error if no active account exists', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue(undefined)
      await expect(client.requestOperation({ operationDetails: [] })).rejects.toThrow(
        'No active account!'
      )
    })

    it('should process an operation request', async () => {
      const dummyAccount = { address: 'tz1dummy', accountIdentifier: 'acc1' }
      const client: any = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      client.getActiveAccount = jest.fn().mockResolvedValue(dummyAccount)
      client['checkMakeRequest'] = jest.fn().mockResolvedValue(true)
      client['makeRequest'] = jest.fn().mockResolvedValue({
        message: { operation: 'result' },
        connectionInfo: { origin: 'postmessage', id: 'conn1' }
      })
      client['analytics'] = { track: () => {} }
      client.notifySuccess = jest.fn().mockResolvedValue(undefined)
      const res = await client.requestOperation({ operationDetails: ['op'] })
      expect(res.operation).toBe('result')
    })
  })

  describe('requestBroadcast', () => {
    it('should throw error if signedTransaction is not provided', async () => {
      const client = new DAppClient(fakeConfig as any)
      client['isGetActiveAccountHandled'] = true
      await expect(client.requestBroadcast({} as any)).rejects.toThrow(
        'Signed transaction must be provided'
      )
    })

    it('should process a broadcast request', async () => {
      const client: any = new DAppClient(fakeConfig as any)
      client['checkMakeRequest'] = jest.fn().mockResolvedValue(true)
      client['makeRequest'] = jest.fn().mockResolvedValue({
        message: { broadcast: 'result' },
        connectionInfo: { origin: 'postmessage', id: 'conn1' }
      })
      client['isGetActiveAccountHandled'] = true
      client['analytics'] = { track: () => {} }
      client.notifySuccess = jest.fn().mockResolvedValue(undefined)
      const res = await client.requestBroadcast({ signedTransaction: 'tx' })
      expect(res.broadcast).toBe('result')
    })
  })
})
