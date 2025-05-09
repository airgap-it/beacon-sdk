// PermissionManager.test.ts
import { Storage, PermissionInfo } from '@airgap/beacon-types'
import { StorageManager } from '../../src/managers/StorageManager'
import { PermissionManager } from '../../src/managers/PermissionManager'

// mock the entire StorageManager module
jest.mock('../../src/managers/StorageManager')
// and the PermissionValidator
jest.mock('../../src/managers/PermissionValidator')

describe('PermissionManager', () => {
  let storage: Storage
  let manager: PermissionManager

  // create typed jest mocks for the StorageManager instance methods
  const mockGetAll = jest.fn<Promise<PermissionInfo[] | null>, []>()
  const mockGetOne = jest.fn<
    Promise<PermissionInfo | undefined>,
    [(perm: PermissionInfo) => boolean]
  >()
  const mockAddOne = jest.fn<Promise<void>, [PermissionInfo, (perm: PermissionInfo) => boolean]>()
  const mockRemove = jest.fn<Promise<void>, [(perm: PermissionInfo) => boolean]>()
  const mockRemoveAll = jest.fn<Promise<void>, []>()

  beforeEach(() => {
    // reset our mocks
    jest.clearAllMocks()

    // have StorageManager constructor return an object with our mock methods
    ;(StorageManager as jest.Mock).mockImplementation(() => ({
      getAll: mockGetAll,
      getOne: mockGetOne,
      addOne: mockAddOne,
      remove: mockRemove,
      removeAll: mockRemoveAll
    }))

    storage = {} as Storage
    manager = new PermissionManager(storage)
  })

  describe('getPermissions', () => {
    it('returns [] if storage.getAll() resolves to null', async () => {
      mockGetAll.mockResolvedValueOnce(null)

      const result = await manager.getPermissions()

      expect(mockGetAll).toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('returns whatever storage.getAll() returns', async () => {
      const perms: PermissionInfo[] = [
        { accountIdentifier: 'A', senderId: 'S', scopes: ['scope1'] }
      ] as any
      mockGetAll.mockResolvedValueOnce(perms)

      const result = await manager.getPermissions()

      expect(mockGetAll).toHaveBeenCalled()
      expect(result).toBe(perms)
    })
  })

  describe('getPermission', () => {
    it('forwards the predicate to storage.getOne and returns its result', async () => {
      const sample: PermissionInfo = { accountIdentifier: 'X', senderId: 'Y', scopes: [] } as any
      mockGetOne.mockResolvedValueOnce(sample)

      const result = await manager.getPermission('X')

      // storage.getOne should have been called with a function
      expect(mockGetOne).toHaveBeenCalledTimes(1)
      const [predicate] = mockGetOne.mock.calls[0]
      expect(typeof predicate).toBe('function')

      // predicate should match only if accountIdentifier matches
      expect(predicate(sample)).toBe(true)
      expect(predicate({ ...sample, accountIdentifier: 'Z' })).toBe(false)

      expect(result).toBe(sample)
    })
  })

  describe('addPermission', () => {
    it('calls storage.addOne with the permission and correct dedupe predicate', async () => {
      const perm: PermissionInfo = { accountIdentifier: 'foo', senderId: 'bar', scopes: [] } as any

      await manager.addPermission(perm)

      expect(mockAddOne).toHaveBeenCalledTimes(1)
      const [passedPerm, predicate] = mockAddOne.mock.calls[0]

      expect(passedPerm).toBe(perm)
      expect(typeof predicate).toBe('function')

      // predicate should only match same accountIdentifier AND senderId
      expect(predicate(perm)).toBe(true)
      expect(predicate({ ...perm, senderId: 'other' })).toBe(false)
      expect(predicate({ ...perm, accountIdentifier: 'other' })).toBe(false)
    })
  })

  describe('removeAllPermissions', () => {
    it('delegates to storage.removeAll()', async () => {
      await manager.removeAllPermissions()
      expect(mockRemoveAll).toHaveBeenCalledTimes(1)
    })
  })
})
