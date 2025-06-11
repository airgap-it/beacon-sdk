import { PermissionManager } from '../../src/managers/PermissionManager'
import { PermissionValidator } from '../../src/managers/PermissionValidator'
import { Storage, StorageKey, PermissionInfo, BeaconMessage } from '@airgap/beacon-types'

/**
 * A simple in-memory implementation of the Beacon Storage abstract class
 */
class MockStorage extends Storage {
  private store: Record<string, any> = {}

  // Optional: simulate platform support
  public static override isSupported(): Promise<boolean> {
    return Promise.resolve(true)
  }

  public override async get<K extends StorageKey>(key: K): Promise<any> {
    return this.store[key] ?? []
  }

  public override async set<K extends StorageKey>(key: K, value: any): Promise<void> {
    this.store[key] = value
  }

  public override async delete<K extends StorageKey>(key: K): Promise<void> {
    delete this.store[key]
  }

  public override async subscribeToStorageChanged(
    _callback: (arg: {
      eventType: 'storageCleared' | 'entryModified'
      key: string | null
      oldValue: string | null
      newValue: string | null
    }) => void
  ): Promise<void> {
    // no-op for tests
    return
  }

  public override getPrefixedKey<K extends StorageKey>(key: K): string {
    // in real use, this would add a prefix; for tests, return as-is
    return key
  }
}

describe('PermissionManager', () => {
  let storage: MockStorage
  let manager: PermissionManager

  beforeEach(() => {
    storage = new MockStorage()
    manager = new PermissionManager(storage)
  })

  describe('getPermissions & getPermission', () => {
    it('returns an empty array when no permissions have been added', async () => {
      await expect(manager.getPermissions()).resolves.toEqual([])
    })

    it('returns undefined for getPermission when none match', async () => {
      await expect(manager.getPermission('nonexistent')).resolves.toBeUndefined()
    })

    it('can add a permission and then retrieve it by accountIdentifier', async () => {
      const perm = {
        accountIdentifier: 'acc1',
        senderId: 's1',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'App' }
      } as unknown as PermissionInfo
      await manager.addPermission(perm)
      await expect(manager.getPermissions()).resolves.toEqual([perm])
      await expect(manager.getPermission('acc1')).resolves.toEqual(perm)
    })

    it('overwrites an existing permission when added with same accountIdentifier & senderId', async () => {
      const oldPerm = {
        accountIdentifier: 'acc1',
        senderId: 's1',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'Old' }
      } as unknown as PermissionInfo
      const newPerm = {
        accountIdentifier: 'acc1',
        senderId: 's1',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'New' }
      } as unknown as PermissionInfo
      await manager.addPermission(oldPerm)
      await manager.addPermission(newPerm)
      const perms = await manager.getPermissions()
      expect(perms).toHaveLength(1)
      expect(perms[0]).toEqual(newPerm)
    })

    it('allows multiple distinct permissions to coexist', async () => {
      const perm1 = {
        accountIdentifier: 'acc1',
        senderId: 's1',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'One' }
      } as unknown as PermissionInfo
      const perm2 = {
        accountIdentifier: 'acc2',
        senderId: 's2',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'Two' }
      } as unknown as PermissionInfo
      await manager.addPermission(perm1)
      await manager.addPermission(perm2)
      const perms = await manager.getPermissions()
      expect(perms).toHaveLength(2)
      expect(perms).toEqual(expect.arrayContaining([perm1, perm2]))
    })
  })

  describe('removePermission', () => {
    it('removes only the permission matching both accountIdentifier and senderId', async () => {
      const p1 = {
        accountIdentifier: 'acc1',
        senderId: 's1',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'A' }
      } as unknown as PermissionInfo
      const p2 = {
        accountIdentifier: 'acc1',
        senderId: 's2',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'B' }
      } as unknown as PermissionInfo
      const p3 = {
        accountIdentifier: 'acc2',
        senderId: 's3',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'C' }
      } as unknown as PermissionInfo

      await manager.addPermission(p1)
      await manager.addPermission(p2)
      await manager.addPermission(p3)

      await manager.removePermission('acc1', 's2')
      const perms = await manager.getPermissions()
      expect(perms).toHaveLength(2)
      expect(perms).toEqual(expect.arrayContaining([p1, p3]))
    })
  })

  describe('removePermissions', () => {
    it('removes all permissions whose accountIdentifier is in the given list', async () => {
      const p1 = {
        accountIdentifier: 'acc1',
        senderId: 's1',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'X' }
      } as unknown as PermissionInfo
      const p2 = {
        accountIdentifier: 'acc2',
        senderId: 's2',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'Y' }
      } as unknown as PermissionInfo
      const p3 = {
        accountIdentifier: 'acc3',
        senderId: 's3',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'Z' }
      } as unknown as PermissionInfo

      await manager.addPermission(p1)
      await manager.addPermission(p2)
      await manager.addPermission(p3)

      await manager.removePermissions(['acc1', 'acc3'])
      const perms = await manager.getPermissions()
      expect(perms).toHaveLength(1)
      expect(perms[0]).toEqual(p2)
    })
  })

  describe('removeAllPermissions', () => {
    it('clears out all stored permissions', async () => {
      const p1 = {
        accountIdentifier: 'acc1',
        senderId: 's1',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'First' }
      } as unknown as PermissionInfo
      const p2 = {
        accountIdentifier: 'acc2',
        senderId: 's2',
        scopes: [],
        blockchainIdentifier: 'chain',
        sender: { name: 'Second' }
      } as unknown as PermissionInfo

      await manager.addPermission(p1)
      await manager.addPermission(p2)

      await manager.removeAllPermissions()
      await expect(manager.getPermissions()).resolves.toEqual([])
    })
  })

  describe('hasPermission', () => {
    it('delegates to PermissionValidator.hasPermission and returns its result', async () => {
      const dummyMessage = { type: 'DUMMY' } as unknown as BeaconMessage
      const spy = jest.spyOn(PermissionValidator, 'hasPermission').mockResolvedValue(true)

      await expect(manager.hasPermission(dummyMessage)).resolves.toBe(true)
      expect(spy).toHaveBeenCalledWith(dummyMessage, expect.any(Function), expect.any(Function))

      spy.mockRestore()
    })

    it('propagates errors from PermissionValidator', async () => {
      const dummyMessage = { type: 'BAD' } as unknown as BeaconMessage
      const error = new Error('not handled')
      jest.spyOn(PermissionValidator, 'hasPermission').mockRejectedValue(error)
      await expect(manager.hasPermission(dummyMessage)).rejects.toThrow('not handled')
    })
  })
})
