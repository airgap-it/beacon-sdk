import { BeaconMessage, Storage, StorageKey, PermissionInfo } from '@mavrykdynamics/beacon-types'
import { StorageManager } from './StorageManager'
import { PermissionValidator } from './PermissionValidator'

/**
 * @internalapi
 *
 * The PermissionManager provides CRUD functionality for permission entities and persists them to the provided storage.
 */
export class PermissionManager {
  private readonly storageManager: StorageManager<StorageKey.PERMISSION_LIST>

  constructor(storage: Storage) {
    this.storageManager = new StorageManager(storage, StorageKey.PERMISSION_LIST)
  }

  public async getPermissions(): Promise<PermissionInfo[]> {
    return (await this.storageManager.getAll()) ?? []
  }

  public async getPermission(accountIdentifier: string): Promise<PermissionInfo | undefined> {
    return this.storageManager.getOne(
      (permission: PermissionInfo) => permission.accountIdentifier === accountIdentifier
    )
  }

  public async addPermission(permissionInfo: PermissionInfo): Promise<void> {
    return this.storageManager.addOne(
      permissionInfo,
      (permission: PermissionInfo) =>
        permission.accountIdentifier === permissionInfo.accountIdentifier &&
        permission.senderId === permissionInfo.senderId
    )
  }

  public async removePermission(accountIdentifier: string): Promise<void> {
    return this.storageManager.remove(
      (permissionInfo: PermissionInfo) => permissionInfo.accountIdentifier === accountIdentifier
    )
  }

  public async removePermissions(accountIdentifiers: string[]): Promise<void> {
    return this.storageManager.remove((permission: PermissionInfo) =>
      accountIdentifiers.includes(permission.accountIdentifier)
    )
  }

  public async removeAllPermissions(): Promise<void> {
    return this.storageManager.removeAll()
  }

  public async hasPermission(message: BeaconMessage): Promise<boolean> {
    return PermissionValidator.hasPermission(
      message,
      this.getPermission.bind(this),
      this.getPermissions.bind(this)
    )
  }
}
