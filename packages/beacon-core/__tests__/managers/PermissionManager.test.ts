// __tests__/managers/PermissionManager.test.ts

import { PermissionManager } from '../../src/managers/PermissionManager'
import { BeaconMessage } from '@airgap/beacon-types'
import { PermissionValidator } from '../../src/managers/PermissionValidator'

// Mock PermissionValidator so that we can control its behavior
jest.mock('../../src/managers/PermissionValidator', () => {
  return {
    PermissionValidator: {
      hasPermission: jest.fn()
    }
  }
})

describe('PermissionManager', () => {
  let permissionManager: any // PermissionManager type
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
    permissionManager = new PermissionManager(storage)
    // Override the internal storageManager with our own mock object.
    mockStorageManager = {
      getAll: jest.fn(),
      getOne: jest.fn(),
      addOne: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    }
    // Replace the private storageManager property using bracket notation.
    permissionManager['storageManager'] = mockStorageManager
    jest.clearAllMocks()
  })

  describe('getPermissions', () => {
    it('should return permission list when storage has data', async () => {
      const permissionList: any[] = [
        { accountIdentifier: 'acc1', senderId: 'sender1' },
        { accountIdentifier: 'acc2', senderId: 'sender2' }
      ]
      mockStorageManager.getAll.mockResolvedValue(permissionList)
      const result = await permissionManager.getPermissions()
      expect(result).toEqual(permissionList)
    })

    it('should return an empty array when getAll returns null', async () => {
      mockStorageManager.getAll.mockResolvedValue(null)
      const result = await permissionManager.getPermissions()
      expect(result).toEqual([])
    })
  })

  describe('getPermission', () => {
    it('should return the correct permission', async () => {
      const permission: any = { accountIdentifier: 'acc1', senderId: 'sender1' }
      // Configure getOne to return the permission if the predicate matches
      mockStorageManager.getOne.mockImplementation(async (predicate: Function) => {
        return predicate(permission) ? permission : undefined
      })
      const result = await permissionManager.getPermission('acc1')
      expect(result).toEqual(permission)
    })

    it('should return undefined if permission is not found', async () => {
      mockStorageManager.getOne.mockResolvedValue(undefined)
      const result = await permissionManager.getPermission('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('addPermission', () => {
    it('should add the permission', async () => {
      const permission: any = { accountIdentifier: 'acc1', senderId: 'sender1' }
      await permissionManager.addPermission(permission)
      expect(mockStorageManager.addOne).toHaveBeenCalledWith(permission, expect.any(Function))
      // Validate that the predicate function returns true for a matching permission
      const predicate = mockStorageManager.addOne.mock.calls[0][1]
      expect(predicate({ accountIdentifier: 'acc1', senderId: 'sender1' })).toBe(true)
      expect(predicate({ accountIdentifier: 'acc1', senderId: 'different' })).toBe(false)
    })
  })

  describe('removePermission', () => {
    it('should remove the specified permission', async () => {
      await permissionManager.removePermission('acc1')
      expect(mockStorageManager.remove).toHaveBeenCalledWith(expect.any(Function))
      const predicate = mockStorageManager.remove.mock.calls[0][0]
      expect(predicate({ accountIdentifier: 'acc1', senderId: 'any' })).toBe(true)
      expect(predicate({ accountIdentifier: 'acc2', senderId: 'any' })).toBe(false)
    })
  })

  describe('removePermissions', () => {
    it('should remove multiple permissions', async () => {
      const accountIdentifiers = ['acc1', 'acc2']
      await permissionManager.removePermissions(accountIdentifiers)
      expect(mockStorageManager.remove).toHaveBeenCalledWith(expect.any(Function))
      const predicate = mockStorageManager.remove.mock.calls[0][0]
      expect(predicate({ accountIdentifier: 'acc1', senderId: 'any' })).toBe(true)
      expect(predicate({ accountIdentifier: 'acc2', senderId: 'any' })).toBe(true)
      expect(predicate({ accountIdentifier: 'acc3', senderId: 'any' })).toBe(false)
    })
  })

  describe('removeAllPermissions', () => {
    it('should remove all permissions', async () => {
      await permissionManager.removeAllPermissions()
      expect(mockStorageManager.removeAll).toHaveBeenCalled()
    })
  })

  describe('hasPermission', () => {
    it('should delegate permission check to PermissionValidator', async () => {
      const message: BeaconMessage = { type: 'test' } as any
      ;(PermissionValidator.hasPermission as jest.Mock).mockResolvedValue(true)
      const result = await permissionManager.hasPermission(message)
      expect(result).toBe(true)
      expect(PermissionValidator.hasPermission).toHaveBeenCalledWith(
        message,
        expect.any(Function),
        expect.any(Function)
      )
    })
  })
})
