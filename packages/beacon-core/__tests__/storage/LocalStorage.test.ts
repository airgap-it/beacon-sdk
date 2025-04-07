// __tests__/storage/LocalStorage.test.ts

import { LocalStorage } from '../../src/storage/LocalStorage'
import { StorageKey, defaultValues } from '@airgap/beacon-types'

describe('LocalStorage', () => {
  let storageInstance: LocalStorage
  const prefix = 'myprefix'

  beforeEach(() => {
    // Clear localStorage and create a new instance.
    localStorage.clear()
    storageInstance = new LocalStorage(prefix)
  })

  describe('isSupported', () => {
    it('should return true if window.localStorage is available', async () => {
      const supported = await LocalStorage.isSupported()
      expect(supported).toBe(true)
    })
  })

  describe('getPrefixedKey', () => {
    it('should return prefixed key if prefix is provided', () => {
      const key = 'testKey'
      expect(storageInstance.getPrefixedKey(key)).toBe(`${prefix}-${key}`)
    })

    it('should return key as-is if no prefix is provided', () => {
      const instance = new LocalStorage()
      const key = 'testKey'
      expect(instance.getPrefixedKey(key)).toBe(key)
    })
  })

  describe('get', () => {
    const testKey = 'TEST_KEY'
    const prefixedKey = `${prefix}-${testKey}`

    it('should return the parsed value from localStorage if present and valid JSON', async () => {
      const obj = { foo: 'bar' }
      localStorage.setItem(prefixedKey, JSON.stringify(obj))
      const result = await storageInstance.get(testKey as any)
      expect(result).toEqual(obj)
    })

    it('should return the raw value if stored value is not valid JSON', async () => {
      const raw = 'not-json'
      localStorage.setItem(prefixedKey, raw)
      const result = await storageInstance.get(testKey as any)
      expect(result).toEqual(raw)
    })

    it('should return the default value if localStorage does not have the key', async () => {
      // For testing, temporarily override defaultValues for this key.
      const dummyDefault = { default: true }
      const originalDefault = (defaultValues as any)[testKey]
      ;(defaultValues as any)[testKey] = dummyDefault

      const result = await storageInstance.get(testKey as any)
      expect(result).toEqual(dummyDefault)

      // Restore original default.
      ;(defaultValues as any)[testKey] = originalDefault
    })
  })

  describe('set', () => {
    const testKey = 'TEST_KEY'
    const prefixedKey = `${prefix}-${testKey}`

    it('should store a string value as is', async () => {
      const value = 'hello'
      await storageInstance.set(testKey as any, value)
      expect(localStorage.getItem(prefixedKey)).toEqual(value)
    })

    it('should store a non-string value as JSON stringified', async () => {
      const obj = { num: 42 }
      await storageInstance.set(testKey as any, obj)
      expect(localStorage.getItem(prefixedKey)).toEqual(JSON.stringify(obj))
    })
  })

  describe('delete', () => {
    const testKey = 'TEST_KEY'
    const prefixedKey = `${prefix}-${testKey}`

    it('should remove the item from localStorage', async () => {
      localStorage.setItem(prefixedKey, 'value')
      await storageInstance.delete(testKey as any)
      expect(localStorage.getItem(prefixedKey)).toBeNull()
    })
  })

  describe('subscribeToStorageChanged', () => {
    it('should call the callback with a storageCleared event when event.key is null', async () => {
      const callback = jest.fn()
      await storageInstance.subscribeToStorageChanged(callback)
      // Create and dispatch a storage event with no key.
      const event = new StorageEvent('storage', {
        key: null,
        oldValue: null,
        newValue: null
      })
      window.dispatchEvent(event)
      // Wait for the event listener to process the event.
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(callback).toHaveBeenCalledWith({
        eventType: 'storageCleared',
        key: null,
        oldValue: null,
        newValue: null
      })
    })

    it('should call the callback with an entryModified event when event.key is present', async () => {
      const callback = jest.fn()
      await storageInstance.subscribeToStorageChanged(callback)
      const key = 'mykey'
      const prefixedKey = `${prefix}-${key}`
      const event = new StorageEvent('storage', {
        key,
        oldValue: 'old',
        newValue: 'new'
      })
      window.dispatchEvent(event)
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(callback).toHaveBeenCalledWith({
        eventType: 'entryModified',
        key: prefixedKey,
        oldValue: 'old',
        newValue: 'new'
      })
    })
  })
})
