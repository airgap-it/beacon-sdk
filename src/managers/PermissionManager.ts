import { PermissionScope, BeaconMessage, BeaconMessageType, Storage, StorageKey } from '..'
import { getAccountIdentifier } from '../utils/get-account-identifier'
import { PermissionInfo } from '../types/PermissionInfo'

export class PermissionManager {
  private readonly storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  public async getPermissions(): Promise<PermissionInfo[]> {
    return this.storage.get(StorageKey.PERMISSION_LIST)
  }

  public async getPermission(accountIdentifier: string): Promise<PermissionInfo | undefined> {
    const permissions: PermissionInfo[] = await this.storage.get(StorageKey.PERMISSION_LIST)

    return permissions.find(
      (permission: PermissionInfo) => permission.accountIdentifier === accountIdentifier
    )
  }

  public async addPermission(permissionInfo: PermissionInfo): Promise<void> {
    const permissions: PermissionInfo[] = await this.storage.get(StorageKey.PERMISSION_LIST)

    if (
      !permissions.some(
        (permission: PermissionInfo) =>
          permission.accountIdentifier === permissionInfo.accountIdentifier
      )
    ) {
      permissions.push(permissionInfo)
    }

    return this.storage.set(StorageKey.PERMISSION_LIST, permissions)
  }

  public async removePermission(accountIdentifier: string): Promise<void> {
    const permissions: PermissionInfo[] = await this.storage.get(StorageKey.PERMISSION_LIST)

    const filteredPermissions: PermissionInfo[] = permissions.filter(
      (permissionInfo: PermissionInfo) => permissionInfo.accountIdentifier !== accountIdentifier
    )

    return this.storage.set(StorageKey.PERMISSION_LIST, filteredPermissions)
  }

  public async removeAllPermissions(): Promise<void> {
    return this.storage.delete(StorageKey.PERMISSION_LIST)
  }

  /**
   * Check if permissions were given for a certain message type.
   *
   * PermissionRequest and BroadcastRequest will always return true.
   *
   * @param message Beacon Message
   */
  public async hasPermission(message: BeaconMessage): Promise<boolean> {
    switch (message.type) {
      case BeaconMessageType.PermissionRequest: {
        return true
      }
      case BeaconMessageType.OperationRequest: {
        const accountIdentifier: string = await getAccountIdentifier(
          message.sourceAddress,
          message.network
        )

        const permission: PermissionInfo | undefined = await this.getPermission(accountIdentifier)
        if (!permission) {
          return false
        }

        return permission.scopes.includes(PermissionScope.OPERATION_REQUEST)
      }
      case BeaconMessageType.SignPayloadRequest: {
        const permissions: PermissionInfo[] = await this.getPermissions()
        const filteredPermissions: PermissionInfo[] = permissions.filter(
          (permission: PermissionInfo) => permission.address === message.sourceAddress
        )

        if (filteredPermissions.length === 0) {
          return false
        }

        return filteredPermissions.some((permission: PermissionInfo) =>
          permission.scopes.includes(PermissionScope.SIGN)
        )
      }
      case BeaconMessageType.BroadcastRequest: {
        return true
      }

      default:
        throw new Error('Message not handled')
    }
  }
}
