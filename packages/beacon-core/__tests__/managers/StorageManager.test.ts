// __tests__/managers/StorageManager.test.ts

import { StorageManager } from '../../src/managers/StorageManager'
import { Storage, StorageKey } from '@airgap/beacon-types'

describe('StorageManager', () => {
  // For testing, we'll use StorageKey.APP_METADATA_LIST as a concrete key.
  // Adjust the key as needed based on your type mapping.
  const dummyKey = StorageKey.APP_METADATA_LIST

  // Create a dummy storage object with jest.fn() methods.
  let storage: Storage
  let storageManager: StorageManager<typeof dummyKey>

  beforeEach(() => {
    storage = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    } as unknown as Storage
    storageManager = new StorageManager(storage, dummyKey)
  })

  describe('getAll', () => {
    it('should return the stored array when data is present', async () => {
      const storedData = [
        { id: '1', value: 'a' },
        { id: '2', value: 'b' }
      ]
      ;(storage.get as jest.Mock).mockResolvedValue(storedData)
      const result = await storageManager.getAll()
      expect(result).toEqual(storedData)
    })

    it('should return an empty array if storage returns null', async () => {
      ;(storage.get as jest.Mock).mockResolvedValue(null)
      const result = await storageManager.getAll()
      expect(result).toEqual([])
    })
  })

  describe('getOne', () => {
    it('should return the first element that matches the predicate', async () => {
      const storedData = [
        { id: '1', value: 'a' },
        { id: '2', value: 'b' },
        { id: '3', value: 'c' }
      ]
      ;(storage.get as jest.Mock).mockResolvedValue(storedData)
      const predicate = (elem: any) => elem.id === '2'
      const result = await storageManager.getOne(predicate)
      expect(result).toEqual({ id: '2', value: 'b' })
    })

    it('should return undefined if no element matches the predicate', async () => {
      const storedData = [
        { id: '1', value: 'a' },
        { id: '2', value: 'b' }
      ]
      ;(storage.get as jest.Mock).mockResolvedValue(storedData)
      const predicate = (elem: any) => elem.id === '3'
      const result = await storageManager.getOne(predicate)
      expect(result).toBeUndefined()
    })
  })

  describe('addOne', () => {
    it('should add the element if no existing element matches the predicate', async () => {
      const initialData: any[] = []
      ;(storage.get as jest.Mock).mockResolvedValue(initialData)
      const newElement: any = { id: '1', value: 'a' }
      const predicate = (elem: any) => elem.id === newElement.id
      await storageManager.addOne(newElement, predicate)
      // Expect the new element to be pushed and storage.set to be called with the updated array.
      expect(storage.set).toHaveBeenCalledWith(dummyKey, [newElement])
    })

    it('should update the element if one matches and overwrite is true', async () => {
      const initialData = [{ id: '1', value: 'old' }]
      ;(storage.get as jest.Mock).mockResolvedValue(initialData)
      const newElement: any = { id: '1', value: 'new' }
      const predicate = (elem: any) => elem.id === newElement.id
      await storageManager.addOne(newElement, predicate, true)
      // Expect the matching element to be replaced.
      expect(storage.set).toHaveBeenCalledWith(dummyKey, [newElement])
    })

    it('should leave the array unchanged if one matches and overwrite is false', async () => {
      const initialData = [{ id: '1', value: 'old' }]
      ;(storage.get as jest.Mock).mockResolvedValue(initialData)
      const newElement: any = { id: '1', value: 'new' }
      const predicate = (elem: any) => elem.id === newElement.id
      await storageManager.addOne(newElement, predicate, false)
      // Since overwrite is false, the array remains unchanged.
      expect(storage.set).toHaveBeenCalledWith(dummyKey, initialData)
    })
  })

  describe('remove', () => {
    it('should remove elements that match the predicate', async () => {
      const initialData = [
        { id: '1', value: 'a' },
        { id: '2', value: 'b' },
        { id: '3', value: 'c' }
      ]
      ;(storage.get as jest.Mock).mockResolvedValue(initialData)
      const predicate = (elem: any) => elem.id === '2'
      await storageManager.remove(predicate)
      const expectedData = [
        { id: '1', value: 'a' },
        { id: '3', value: 'c' }
      ]
      expect(storage.set).toHaveBeenCalledWith(dummyKey, expectedData)
    })
  })

  describe('removeAll', () => {
    it('should delete the storage key', async () => {
      await storageManager.removeAll()
      expect(storage.delete).toHaveBeenCalledWith(dummyKey)
    })
  })
})
