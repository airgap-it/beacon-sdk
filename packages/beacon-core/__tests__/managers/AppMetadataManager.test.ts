// __tests__/managers/AppMetadataManager.test.ts

import { AppMetadataManager } from '../../src/managers/AppMetadataManager'
import { AppMetadata } from '@airgap/beacon-types'

describe('AppMetadataManager', () => {
  let appMetadataManager: any // AppMetadataManager type
  let storage: any
  let mockStorageManager: {
    getAll: jest.Mock
    getOne: jest.Mock
    addOne: jest.Mock
    remove: jest.Mock
    removeAll: jest.Mock
  }

  beforeEach(() => {
    storage = {} // Dummy storage instance
    appMetadataManager = new AppMetadataManager(storage)

    // Override the internal storageManager with our own mock
    mockStorageManager = {
      getAll: jest.fn(),
      getOne: jest.fn(),
      addOne: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    }
    // Override the private property using bracket notation
    appMetadataManager['storageManager'] = mockStorageManager
  })

  describe('getAppMetadataList', () => {
    it('should return app metadata list when storage has data', async () => {
      const appMetadataList: AppMetadata[] = [
        { senderId: '1', name: 'App 1' },
        { senderId: '2', name: 'App 2' }
      ]
      mockStorageManager.getAll.mockResolvedValue(appMetadataList)
      const result = await appMetadataManager.getAppMetadataList()
      expect(result).toEqual(appMetadataList)
    })

    it('should return an empty array when getAll returns null', async () => {
      mockStorageManager.getAll.mockResolvedValue(null)
      const result = await appMetadataManager.getAppMetadataList()
      expect(result).toEqual([])
    })
  })

  describe('getAppMetadata', () => {
    it('should return the correct app metadata', async () => {
      const appMetadata: AppMetadata = { senderId: 'abc', name: 'Test App' }
      // Configure getOne to return the appMetadata if the predicate matches
      mockStorageManager.getOne.mockImplementation(async (predicate: Function) => {
        return predicate(appMetadata) ? appMetadata : undefined
      })
      const result = await appMetadataManager.getAppMetadata('abc')
      expect(result).toEqual(appMetadata)
    })

    it('should return undefined if no app metadata is found', async () => {
      mockStorageManager.getOne.mockResolvedValue(undefined)
      const result = await appMetadataManager.getAppMetadata('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('addAppMetadata', () => {
    it('should add the app metadata', async () => {
      const appMetadata: AppMetadata = { senderId: 'def', name: 'New App' }
      await appMetadataManager.addAppMetadata(appMetadata)
      expect(mockStorageManager.addOne).toHaveBeenCalledWith(appMetadata, expect.any(Function))
      // Validate that the predicate function returns true for the added app metadata
      const predicate = mockStorageManager.addOne.mock.calls[0][1]
      expect(predicate(appMetadata)).toBe(true)
    })
  })

  describe('removeAppMetadata', () => {
    it('should remove the specified app metadata', async () => {
      await appMetadataManager.removeAppMetadata('123')
      expect(mockStorageManager.remove).toHaveBeenCalledWith(expect.any(Function))
      const predicate = mockStorageManager.remove.mock.calls[0][0]
      expect(predicate({ senderId: '123' })).toBe(true)
      expect(predicate({ senderId: '456' })).toBe(false)
    })
  })

  describe('removeAppMetadatas', () => {
    it('should remove multiple app metadata entries', async () => {
      const senderIds = ['1', '2']
      await appMetadataManager.removeAppMetadatas(senderIds)
      expect(mockStorageManager.remove).toHaveBeenCalledWith(expect.any(Function))
      const predicate = mockStorageManager.remove.mock.calls[0][0]
      expect(predicate({ senderId: '1' })).toBe(true)
      expect(predicate({ senderId: '2' })).toBe(true)
      expect(predicate({ senderId: '3' })).toBe(false)
    })
  })

  describe('removeAllAppMetadata', () => {
    it('should remove all app metadata', async () => {
      await appMetadataManager.removeAllAppMetadata()
      expect(mockStorageManager.removeAll).toHaveBeenCalled()
    })
  })
})
