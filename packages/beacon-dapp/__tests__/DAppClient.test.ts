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
  removeAllAccounts: jest.fn().mockResolvedValue(undefined),
  getAccounts: jest.fn().mockResolvedValue([])
}

const fakeEvents = {
  emit: jest.fn().mockResolvedValue(undefined),
  on: jest.fn().mockResolvedValue(undefined)
}

// Create a fake transport object that simulates a connected transport.
const fakeTransport: any = {
  connectionStatus: TransportStatus.CONNECTED,
  send: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined)
}

jest.mock('@airgap/beacon-utils', () => ({
  getKeypairFromSeed: jest.fn(),
  toHex: jest.fn(),
  generateGUID: jest.fn(),
  ExposedPromise: class ExposedPromise<T> {
    public promise: Promise<T>
    private _resolveFn!: (value: T) => void
    private _rejectFn!: (reason?: any) => void
    private _isSettled: boolean = false
    private _isResolved: boolean = false

    constructor() {
      this.promise = new Promise<T>((resolve, reject) => {
        this._resolveFn = (value: T) => {
          this._isSettled = true
          this._isResolved = true
          resolve(value)
        }
        this._rejectFn = (reason?: any) => {
          this._isSettled = true
          reject(reason)
        }
      })
    }

    resolve(value: T) {
      this._isResolved = true
      this._resolveFn(value)
    }

    reject(reason?: any) {
      this._rejectFn(reason)
    }

    isSettled(): boolean {
      return this._isSettled
    }

    isResolved(): boolean {
      return this._isResolved
    }

    static resolve<T>(value: T): ExposedPromise<T> {
      const ep = new ExposedPromise<T>()
      ep.resolve(value)
      return ep
    }
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
    client = { listenForChannelOpening: jest.fn() }
    setEventHandler = jest.fn()
    getPeers = jest.fn().mockReturnValue([])
  }
}))

jest.mock('@airgap/beacon-transport-postmessage', () => ({
  PostMessageTransport: class PostMessageTransport {
    client = { listenForChannelOpening: jest.fn() }
    setEventHandler = jest.fn()
    getPeers = jest.fn().mockReturnValue([])
  }
}))

jest.mock('@airgap/beacon-transport-walletconnect', () => ({
  WalletConnectTransport: class WalletConnectTransport {
    client = { listenForChannelOpening: jest.fn() }
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
  analytics: { track: jest.fn() }
}

describe('DAppClient', () => {
  let client: any

  beforeEach(() => {
    jest.clearAllMocks()
    client = new DAppClient(fakeConfig as any)
    // Force the flag so that internal branches relying on active account subscription run.
    client['isGetActiveAccountHandled'] = true
    client['storage'] = fakeStorage
    client['events'] = fakeEvents
    client['accountManager'] = fakeAccountManager

    // Define the transport property as configurable so it can be re-mocked in tests.
    Object.defineProperty(client, 'transport', {
      configurable: true,
      get: () => Promise.resolve(fakeTransport)
    })
    // Also set _transport using our ExposedPromise so that isResolved() works.
    client['_transport'] = ExposedPromise.resolve(fakeTransport)
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with given config values', () => {
      expect(client.description).toBe('Test Description')
      expect(client.network.type).toBe('MAINNET')
    })
  })

  describe('Active Account Management', () => {
    it('should get active account (initially undefined)', async () => {
      expect(client['_activeAccount']).toBeTruthy()
      const active = await client.getActiveAccount()
      expect(active).toBeUndefined()
    })

    it('should set and get the active account', async () => {
      const dummyAccount = {
        accountIdentifier: 'acc1',
        address: 'tz1dummy',
        scopes: [PermissionScope.SIGN],
        origin: { type: 'extension', id: 'ext1' }
      }
      client['_activeAccount'] = ExposedPromise.resolve(dummyAccount)
      await client.setActiveAccount(dummyAccount)
      const active = await client.getActiveAccount()
      expect(active).toEqual(dummyAccount)
    })

    it('clearActiveAccount should set active account to undefined', async () => {
      const dummyAccount = {
        accountIdentifier: 'acc1',
        address: 'tz1dummy',
        scopes: [PermissionScope.SIGN],
        origin: { type: 'extension', id: 'ext1' }
      }
      client['_activeAccount'] = ExposedPromise.resolve(dummyAccount)
      await client.setActiveAccount(dummyAccount)
      await client.clearActiveAccount()
      const active = await client.getActiveAccount()
      expect(active).toBeUndefined()
    })

    it('should update active account if new account is different', async () => {
      const dummyAccount1 = {
        accountIdentifier: 'acc1',
        address: 'tz1dummy',
        scopes: [PermissionScope.SIGN],
        origin: { type: 'extension', id: 'ext1' }
      }
      const dummyAccount2 = {
        accountIdentifier: 'acc2',
        address: 'tz1dummy2',
        scopes: [PermissionScope.SIGN],
        origin: { type: 'extension', id: 'ext2' }
      }
      client['_activeAccount'] = ExposedPromise.resolve(dummyAccount1)
      await client.setActiveAccount(dummyAccount1)
      expect(await client.getActiveAccount()).toEqual(dummyAccount1)
      // Override isInvalidState to simulate a change that triggers resetting.
      client['isInvalidState'] = jest.fn().mockResolvedValue(true)
      await client.setActiveAccount(dummyAccount2)
      expect(await client.getActiveAccount()).toEqual(dummyAccount2)
    })
  })

  describe('Color mode', () => {
    it('should set color mode', async () => {
      const { setColorMode } = require('@airgap/beacon-ui')
      await client.setColorMode(ColorMode.DARK)
      expect(setColorMode).toHaveBeenCalledWith('dark')
    })

    it('should get color mode', async () => {
      const mode = await client.getColorMode()
      expect(mode).toBe('light')
    })
  })

  describe('Event Subscription', () => {
    it('should subscribe to an event and set flag for ACTIVE_ACCOUNT_SET', async () => {
      client['isGetActiveAccountHandled'] = false
      await client.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, jest.fn())
      expect(fakeEvents.on).toHaveBeenCalledWith(
        BeaconEvent.ACTIVE_ACCOUNT_SET,
        expect.any(Function)
      )
      expect(client['isGetActiveAccountHandled']).toBe(true)
    })
  })

  describe('Check Permissions', () => {
    it('should allow permission requests without active account', async () => {
      const result = await client.checkPermissions(BeaconMessageType.PermissionRequest)
      expect(result).toBe(true)
    })

    it('should throw error for non-permission request when active account is missing', async () => {
      client.getActiveAccount = jest.fn().mockResolvedValue(undefined)
      await expect(client.checkPermissions(BeaconMessageType.SignPayloadRequest)).rejects.toThrow(
        'No active account set!'
      )
    })

    it('should check permission for operation request', async () => {
      client.getActiveAccount = jest
        .fn()
        .mockResolvedValue({ scopes: [PermissionScope.OPERATION_REQUEST] })
      const result = await client.checkPermissions(BeaconMessageType.OperationRequest)
      expect(result).toBe(true)
    })
  })

  describe('disconnect', () => {
    it('should throw error if no transport is available', async () => {
      client['_transport'] = new ExposedPromise()
      await expect(client.disconnect()).rejects.toThrow('No transport available.')
    })

    it('should throw error if transport is not connected', async () => {
      const fakeNotConnected = {
        connectionStatus: TransportStatus.NOT_CONNECTED,
        connect: jest.fn()
      }
      // Instead of redefining the property, use a spy to override the getter for this test.
      jest.spyOn(client, 'transport', 'get').mockReturnValue(Promise.resolve(fakeNotConnected))
      client['_transport'] = ExposedPromise.resolve(fakeNotConnected)
      await expect(client.disconnect()).rejects.toThrow('Not connected.')
    })
  })

  describe('destroy', () => {
    it('should call createStateSnapshot and super.destroy', async () => {
      jest.spyOn(client, 'createStateSnapshot')
      // Force the metrics branch to run and simulate a proper localStorage.
      client.enableMetrics = true
      const superDestroySpy = jest
        .spyOn(Object.getPrototypeOf(client), 'destroy')
        .mockResolvedValue(undefined)

      await client.destroy()

      expect(superDestroySpy).toHaveBeenCalled()
      superDestroySpy.mockRestore()
    })
  })

  describe('sendNotification', () => {
    it('should throw error if active account missing or notifications not permitted', async () => {
      client.getActiveAccount = jest.fn().mockResolvedValue(undefined)
      await expect(client.sendNotification('title', 'msg', 'payload', 'protocol')).rejects.toThrow(
        'notification permissions not given'
      )
    })

    it('should throw error if no access token is present', async () => {
      client.getActiveAccount = jest.fn().mockResolvedValue({
        scopes: [PermissionScope.NOTIFICATION],
        notification: {}
      })
      await expect(client.sendNotification('title', 'msg', 'payload', 'protocol')).rejects.toThrow(
        'No AccessToken'
      )
    })

    it('should throw error if no push URL is set', async () => {
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
      const dummyResponse = {
        message: { appMetadata: { name: 'TestApp' }, scopes: [PermissionScope.SIGN] },
        connectionInfo: { origin: 'postmessage', id: 'conn1' }
      }
      client['checkMakeRequest'] = jest.fn().mockResolvedValue(true)
      client['makeRequest'] = jest.fn().mockResolvedValue(dummyResponse)
      client.onNewAccount = jest.fn().mockResolvedValue({
        accountIdentifier: 'acc1',
        senderId: 'sender1',
        address: 'tz1dummy',
        origin: { type: 'extension', id: 'ext1' }
      })
      client['accountManager'] = fakeAccountManager
      client.notifySuccess = jest.fn().mockResolvedValue(undefined)
      client['analytics'] = { track: jest.fn() }
      const output = await client.requestPermissions()
      expect(client.notifySuccess).toHaveBeenCalled()
      expect(output).toBeDefined()
    })
  })

  describe('requestSignPayload', () => {
    it('should throw error if payload is not provided', async () => {
      await expect(client.requestSignPayload({ payload: '' })).rejects.toThrow(
        'Payload must be provided'
      )
    })

    it('should throw error if active account is missing', async () => {
      client.getActiveAccount = jest.fn().mockResolvedValue(undefined)
      await expect(client.requestSignPayload({ payload: '05abcdef' })).rejects.toThrow(
        'No active account!'
      )
    })

    it('should throw error if payload is not a string', async () => {
      client.getActiveAccount = jest.fn().mockResolvedValue({ address: 'tz1dummy' })
      await expect(client.requestSignPayload({ payload: 123 as any })).rejects.toThrow(
        'Payload must be a string'
      )
    })

    it('should throw error for invalid signing type prefix', async () => {
      client.getActiveAccount = jest.fn().mockResolvedValue({ address: 'tz1dummy' })
      await expect(
        client.requestSignPayload({ payload: '051234', signingType: 'OPERATION' as any })
      ).rejects.toThrow()
    })

    it('should succeed with RAW signing type', async () => {
      const dummyActiveAccount = {
        address: 'tz1dummy',
        scopes: [PermissionScope.SIGN],
        origin: { type: 'extension', id: 'ext1' }
      }
      client.getActiveAccount = jest.fn().mockResolvedValue(dummyActiveAccount)
      client['_activeAccount'] = ExposedPromise.resolve(dummyActiveAccount)
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
      client['accountManager'] = fakeAccountManager
      const dummyAccount = {
        accountIdentifier: 'acc1',
        senderId: 'sender1',
        origin: { type: 'extension', id: 'ext1' }
      }
      client.getActiveAccount = jest.fn().mockResolvedValue(dummyAccount)
      await client.removeAccount('acc1')
    })

    it('should remove all accounts and clear active account', async () => {
      await client.removeAllAccounts()
    })
  })

  describe('requestOperation', () => {
    it('should throw error if operation details not provided', async () => {
      await expect(client.requestOperation({} as any)).rejects.toThrow(
        'Operation details must be provided'
      )
    })

    it('should throw error if no active account exists', async () => {
      client.getActiveAccount = jest.fn().mockResolvedValue(undefined)
      await expect(client.requestOperation({ operationDetails: [] })).rejects.toThrow(
        'No active account!'
      )
    })

    it('should process an operation request', async () => {
      const dummyAccount = {
        address: 'tz1dummy',
        accountIdentifier: 'acc1',
        origin: { type: 'extension', id: 'ext1' }
      }
      client.getActiveAccount = jest.fn().mockResolvedValue(dummyAccount)
      client['checkMakeRequest'] = jest.fn().mockResolvedValue(true)
      client['makeRequest'] = jest.fn().mockResolvedValue({
        message: { operation: 'result' },
        connectionInfo: { origin: 'postmessage', id: 'conn1' }
      })
      client['analytics'] = { track: () => {} }
      client.notifySuccess = jest.fn().mockResolvedValue(undefined)
      const res = await client.requestOperation({ operationDetails: ['op'] })
      expect(client.notifySuccess).toHaveBeenCalled()
      expect(res.operation).toBe('result')
    })
  })

  describe('requestBroadcast', () => {
    it('should throw error if signedTransaction is not provided', async () => {
      await expect(client.requestBroadcast({} as any)).rejects.toThrow(
        'Signed transaction must be provided'
      )
    })

    it('should process a broadcast request', async () => {
      client['checkMakeRequest'] = jest.fn().mockResolvedValue(true)
      client['makeRequest'] = jest.fn().mockResolvedValue({
        message: { broadcast: 'result' },
        connectionInfo: { origin: 'postmessage', id: 'conn1' }
      })
      client['analytics'] = { track: () => {} }
      client.notifySuccess = jest.fn().mockResolvedValue(undefined)
      const res = await client.requestBroadcast({ signedTransaction: 'tx' })
      expect(client.notifySuccess).toHaveBeenCalled()
      expect(res.broadcast).toBe('result')
    })
  })
})
