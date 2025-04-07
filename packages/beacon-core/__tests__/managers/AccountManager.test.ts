// __tests__/managers/AccountManager.test.ts

import { AccountManager } from '../../src/managers/AccountManager'
import { PermissionValidator } from '../../src/managers/PermissionValidator'

// We still mock PermissionValidator, as before.
jest.mock('../../src/managers/PermissionValidator', () => {
  return {
    PermissionValidator: {
      hasPermission: jest.fn()
    }
  }
})

describe('AccountManager', () => {
  let accountManager: any // AccountManager type
  let storage: any
  let mockStorageManager: {
    getAll: jest.Mock
    getOne: jest.Mock
    addOne: jest.Mock
    remove: jest.Mock
    removeAll: jest.Mock
  }

  beforeEach(() => {
    // Create a dummy storage instance
    storage = {}
    accountManager = new AccountManager(storage)

    // Override the private storageManager with a mock object
    mockStorageManager = {
      getAll: jest.fn(),
      getOne: jest.fn(),
      addOne: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    }
    // Use bracket notation to override the private property
    accountManager['storageManager'] = mockStorageManager
  })

  describe('getAccounts', () => {
    it('should return accounts when storage has data', async () => {
      const accounts = [{ accountIdentifier: '1', name: 'Test Account' }]
      mockStorageManager.getAll.mockResolvedValue(accounts)
      const result = await accountManager.getAccounts()
      expect(result).toEqual(accounts)
    })

    it('should return an empty array when getAll returns null', async () => {
      mockStorageManager.getAll.mockResolvedValue(null)
      const result = await accountManager.getAccounts()
      expect(result).toEqual([])
    })
  })

  describe('getAccount', () => {
    it('should return the correct account', async () => {
      const account = { accountIdentifier: 'abc', name: 'User' }
      mockStorageManager.getOne.mockImplementation(async (predicate: Function) => {
        return predicate(account) ? account : undefined
      })
      const result = await accountManager.getAccount('abc')
      expect(result).toEqual(account)
    })
  })

  describe('addAccount', () => {
    it('should add the account', async () => {
      const account = { accountIdentifier: 'def', name: 'New Account' }
      await accountManager.addAccount(account)
      expect(mockStorageManager.addOne).toHaveBeenCalledWith(account, expect.any(Function))
      // Validate the predicate function works as expected
      const predicate = mockStorageManager.addOne.mock.calls[0][1]
      expect(predicate(account)).toBe(true)
    })
  })

  describe('updateAccount', () => {
    it('should update an existing account', async () => {
      const account = { accountIdentifier: 'ghi', name: 'Old Name', age: 25 }
      // Configure getOne so that it returns the account when predicate matches
      mockStorageManager.getOne.mockImplementation(async (predicate: Function) => {
        return predicate(account) ? account : undefined
      })

      const updateData = { name: 'Updated Name' }
      mockStorageManager.addOne.mockResolvedValue(undefined)

      const updatedAccount = await accountManager.updateAccount('ghi', updateData)
      expect(updatedAccount).toEqual({ ...account, ...updateData })
      expect(mockStorageManager.addOne).toHaveBeenCalledWith(
        { ...account, ...updateData },
        expect.any(Function),
        true
      )
    })

    it('should return undefined if account does not exist', async () => {
      // Configure getOne to return undefined
      mockStorageManager.getOne.mockResolvedValue(undefined)
      const updatedAccount = await accountManager.updateAccount('nonexistent', { name: 'New Name' })
      expect(updatedAccount).toBeUndefined()
      expect(mockStorageManager.addOne).not.toHaveBeenCalled()
    })
  })

  describe('removeAccount', () => {
    it('should remove the specified account', async () => {
      await accountManager.removeAccount('123')
      expect(mockStorageManager.remove).toHaveBeenCalledWith(expect.any(Function))
      const predicate = mockStorageManager.remove.mock.calls[0][0]
      expect(predicate({ accountIdentifier: '123' })).toBe(true)
      expect(predicate({ accountIdentifier: '456' })).toBe(false)
    })
  })

  describe('removeAccounts', () => {
    it('should remove multiple accounts', async () => {
      const accountIdentifiers = ['1', '2']
      await accountManager.removeAccounts(accountIdentifiers)
      expect(mockStorageManager.remove).toHaveBeenCalledWith(expect.any(Function))
      const predicate = mockStorageManager.remove.mock.calls[0][0]
      expect(predicate({ accountIdentifier: '1' })).toBe(true)
      expect(predicate({ accountIdentifier: '2' })).toBe(true)
      expect(predicate({ accountIdentifier: '3' })).toBe(false)
    })
  })

  describe('removeAllAccounts', () => {
    it('should remove all accounts', async () => {
      await accountManager.removeAllAccounts()
      expect(mockStorageManager.removeAll).toHaveBeenCalled()
    })
  })

  describe('hasPermission', () => {
    it('should delegate permission check to PermissionValidator', async () => {
      // Since PermissionValidator is already mocked, set up its behavior.
      ;(PermissionValidator.hasPermission as jest.Mock).mockResolvedValue(true)
      const message = { type: 'test' }
      const result = await accountManager.hasPermission(message)
      expect(result).toBe(true)
      expect(PermissionValidator.hasPermission).toHaveBeenCalledWith(
        message,
        expect.any(Function),
        expect.any(Function)
      )
    })
  })
})
