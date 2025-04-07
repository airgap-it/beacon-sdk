// __tests__/storage/ChromeStorage.test.ts

import { ChromeStorage } from '../../src/storage/ChromeStorage'
import { StorageKey, defaultValues } from '@airgap/beacon-types'

describe('ChromeStorage', () => {
  let chromeStorage: ChromeStorage

  beforeEach(() => {
    // Set up a dummy chrome environment.
    ;(global as any).chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      runtime: {
        id: 'test-runtime'
      }
    }
    chromeStorage = new ChromeStorage()
  })

  describe('isSupported', () => {
    it('should return true when chrome and runtime exist', async () => {
      const supported = await ChromeStorage.isSupported()
      expect(supported).toBe(true)
    })

    it('should return false when chrome is undefined', async () => {
      ;(global as any).chrome = undefined
      const supported = await ChromeStorage.isSupported()
      expect(supported).toBe(false)
    })

    it('should return false when chrome.runtime is missing', async () => {
      ;(global as any).chrome = { storage: {} }
      const supported = await ChromeStorage.isSupported()
      expect(supported).toBe(false)
    })
  })

  describe('get', () => {
    const testKey = StorageKey.APP_METADATA_LIST

    it('should return the stored value if present', async () => {
      const storedValue = [{ id: '1', name: 'Test' }] // Simulate chrome.storage.local.get callback.

      ;(chrome.storage.local.get as jest.Mock).mockImplementation((_, callback) => {
        callback({ [testKey]: storedValue })
      })
      const result = await chromeStorage.get(testKey)
      expect(result).toEqual(storedValue)
    })

    it('should return the default value if not present', async () => {
      // Simulate chrome.storage.local.get callback with no value for key.
      ;(chrome.storage.local.get as jest.Mock).mockImplementation((_, callback) => {
        callback({})
      })
      const defVal = defaultValues[testKey]
      const result = await chromeStorage.get(testKey)
      if (typeof defVal === 'object') {
        expect(result).toEqual(JSON.parse(JSON.stringify(defVal)))
      } else {
        expect(result).toEqual(defVal)
      }
    })
  })

  describe('set', () => {
    const testKey = StorageKey.APP_METADATA_LIST

    it('should set the value correctly', async () => {
      ;(chrome.storage.local.set as jest.Mock).mockImplementation((obj, callback) => {
        callback()
      })
      const value: any = [{ id: '1', name: 'Test' }]
      await chromeStorage.set(testKey, value)
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { [testKey]: value },
        expect.any(Function)
      )
    })
  })

  describe('delete', () => {
    const testKey = StorageKey.APP_METADATA_LIST

    it('should delete the value by setting it to undefined', async () => {
      ;(chrome.storage.local.set as jest.Mock).mockImplementation((obj, callback) => {
        callback()
      })
      await chromeStorage.delete(testKey)
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { [testKey]: undefined },
        expect.any(Function)
      )
    })
  })

  describe('subscribeToStorageChanged', () => {
    it('should resolve (stub implementation)', async () => {
      // Currently a no-op stub; just ensure it resolves without error.
      await expect(
        (chromeStorage as any).subscribeToStorageChanged(() => {})
      ).resolves.toBeUndefined()
    })
  })

  describe('getPrefixedKey', () => {
    it('should return the key unchanged', () => {
      const key = 'someKey'
      expect(chromeStorage.getPrefixedKey(key)).toBe(key)
    })
  })
})
