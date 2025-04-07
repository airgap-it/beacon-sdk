// __tests__/storage/WCStorage.test.ts

import { WCStorage } from '../../src/storage/WCStorage'
import { StorageKey } from '@airgap/beacon-types'
import { LocalStorage } from '../../src/storage/LocalStorage'

// ----- Fake BroadcastChannel -----
class FakeBroadcastChannel {
  name: string
  onmessage: ((ev: MessageEvent) => void) | null = null
  onmessageerror: ((ev: MessageEvent) => void) | null = null
  postedMessages: any[] = []
  constructor(name: string) {
    this.name = name
  }
  postMessage(message: any) {
    this.postedMessages.push(message)
  }
  close() {}
}
// Override global.BroadcastChannel with our fake.
global.BroadcastChannel = FakeBroadcastChannel as any

describe('WCStorage', () => {
  let wcStorage: any // WCStorage type

  beforeEach(() => {
    wcStorage = new WCStorage()
    // Override the internal storage instances with our own mocks.
    wcStorage['indexedDB'] = {
      get: jest.fn(),
      fillStore: jest.fn().mockResolvedValue(undefined),
      clearStore: jest.fn().mockResolvedValue(undefined)
    } as any
    wcStorage['localStorage'] = {
      get: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined)
    } as any
    // Override LocalStorage.isSupported to simulate a supported environment.
    jest.spyOn(LocalStorage, 'isSupported').mockResolvedValue(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('BroadcastChannel integration', () => {
    it('should call onMessageHandler when a message event is received', () => {
      const messageHandler = jest.fn()
      wcStorage.onMessageHandler = messageHandler
      // Simulate a message event.
      const fakeEvent = { data: { type: 'test-type' } } as MessageEvent
      wcStorage['channel'].onmessage(fakeEvent)
      expect(messageHandler).toHaveBeenCalledWith('test-type')
    })

    it('should call onErrorHandler when a message error event is received', () => {
      const errorHandler = jest.fn()
      wcStorage.onErrorHandler = errorHandler
      const fakeErrorEvent = { data: 'error-data' } as MessageEvent
      wcStorage['channel'].onmessageerror(fakeErrorEvent)
      expect(errorHandler).toHaveBeenCalledWith('error-data')
    })

    it('notify should post a message with the given type', () => {
      // Replace the channel with a fresh fake channel to inspect posted messages.
      wcStorage['channel'] = new FakeBroadcastChannel('test-channel')
      wcStorage.notify('notify-type')
      expect((wcStorage['channel'] as FakeBroadcastChannel).postedMessages).toContainEqual({
        type: 'notify-type'
      })
    })
  })

  describe('hasPairings', () => {
    it('should return true if indexedDB returns non-empty pairings', async () => {
      ;(wcStorage['indexedDB'].get as jest.Mock).mockResolvedValue('[{"id":1}]') // non-empty simulated as string is acceptable if that's what your implementation expects
      const result = await wcStorage.hasPairings()
      expect(result).toBe(true)
      expect(wcStorage['indexedDB'].get).toHaveBeenCalledWith(StorageKey.WC_2_CORE_PAIRING)
    })

    it('should return true if indexedDB returns empty but localStorage returns non-empty pairings', async () => {
      ;(wcStorage['indexedDB'].get as jest.Mock).mockResolvedValueOnce([])
      ;(wcStorage['localStorage'].get as jest.Mock).mockResolvedValueOnce([{ id: 1 }])
      const result = await wcStorage.hasPairings()
      expect(result).toBe(true)
    })
  })

  describe('hasSessions', () => {
    it('should return true if indexedDB returns non-empty sessions', async () => {
      ;(wcStorage['indexedDB'].get as jest.Mock).mockResolvedValue('[{"id":1}]')
      const result = await wcStorage.hasSessions()
      expect(result).toBe(true)
      expect(wcStorage['indexedDB'].get).toHaveBeenCalledWith(StorageKey.WC_2_CLIENT_SESSION)
    })

    it('should return true if indexedDB returns empty but localStorage returns non-empty sessions', async () => {
      ;(wcStorage['indexedDB'].get as jest.Mock).mockResolvedValueOnce([])
      ;(wcStorage['localStorage'].get as jest.Mock).mockResolvedValueOnce([{ id: 1 }])
      const result = await wcStorage.hasSessions()
      expect(result).toBe(true)
    })
  })

  describe('backup', () => {
    it('should call indexedDB.fillStore and catch errors', () => {
      const fillStoreMock = wcStorage['indexedDB'].fillStore as jest.Mock
      // Simulate a rejection.
      fillStoreMock.mockRejectedValue(new Error('fillStore error'))
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      wcStorage.backup()
      return new Promise((resolve) => setTimeout(resolve, 10)).then(() => {
        expect(fillStoreMock).toHaveBeenCalledWith('beacon', 'bug_report', [
          StorageKey.WC_2_CORE_KEYCHAIN
        ])
        expect(consoleErrorSpy).toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
      })
    })
  })

  describe('resetState', () => {
    it('should call indexedDB.clearStore and delete localStorage keys if supported', async () => {
      const clearStoreMock = wcStorage['indexedDB'].clearStore as jest.Mock
      const localDeleteMock = wcStorage['localStorage'].delete as jest.Mock
      await wcStorage.resetState()
      expect(clearStoreMock).toHaveBeenCalled()
      expect(localDeleteMock).toHaveBeenCalledWith(StorageKey.WC_2_CLIENT_SESSION)
      expect(localDeleteMock).toHaveBeenCalledWith(StorageKey.WC_2_CORE_PAIRING)
      expect(localDeleteMock).toHaveBeenCalledWith(StorageKey.WC_2_CORE_KEYCHAIN)
      expect(localDeleteMock).toHaveBeenCalledWith(StorageKey.WC_2_CORE_MESSAGES)
      expect(localDeleteMock).toHaveBeenCalledWith(StorageKey.WC_2_CLIENT_PROPOSAL)
      expect(localDeleteMock).toHaveBeenCalledWith(StorageKey.WC_2_CORE_SUBSCRIPTION)
      expect(localDeleteMock).toHaveBeenCalledWith(StorageKey.WC_2_CORE_HISTORY)
      expect(localDeleteMock).toHaveBeenCalledWith(StorageKey.WC_2_CORE_EXPIRER)
    })
  })
})
