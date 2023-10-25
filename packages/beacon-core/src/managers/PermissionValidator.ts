import {
  BeaconMessage,
  BeaconMessageType,
  PermissionScope,
  PermissionEntity
} from '@mavrykdynamics/beacon-types'
import { getAccountIdentifier } from '../utils/get-account-identifier'

/**
 * @internalapi
 *
 * The PermissionValidator is used to check if permissions for a certain message type have been given
 */
export class PermissionValidator {
  /**
   * Check if permissions were given for a certain message type.
   *
   * PermissionRequest and BroadcastRequest will always return true.
   *
   * @param message Beacon Message
   */
  public static async hasPermission(
    message: BeaconMessage,
    getOne: (id: string) => Promise<PermissionEntity | undefined>,
    getAll: () => Promise<PermissionEntity[]>
  ): Promise<boolean> {
    switch (message.type) {
      case BeaconMessageType.PermissionRequest:
      case BeaconMessageType.BroadcastRequest: {
        return true
      }
      case BeaconMessageType.OperationRequest: {
        const accountIdentifier: string = await getAccountIdentifier(
          message.sourceAddress,
          message.network
        )

        const permission: PermissionEntity | undefined = await getOne(accountIdentifier)
        if (!permission) {
          return false
        }

        return permission.scopes.includes(PermissionScope.OPERATION_REQUEST)
      }
      case BeaconMessageType.SignPayloadRequest: {
        const permissions: PermissionEntity[] = await getAll()
        const filteredPermissions: PermissionEntity[] = permissions.filter(
          (permission: PermissionEntity) => permission.address === message.sourceAddress
        )

        if (filteredPermissions.length === 0) {
          return false
        }

        return filteredPermissions.some((permission: PermissionEntity) =>
          permission.scopes.includes(PermissionScope.SIGN)
        )
      }
      default:
        throw new Error('Message not handled')
    }
  }
}
