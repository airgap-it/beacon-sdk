import { BeaconMessageType, PermissionScope } from '..'

/**
 * Check if permissions are given for a specific message type
 *
 * @param type Beacon message type
 * @param permissions The permission array to check
 */
export const checkPermissions = async (
  type: BeaconMessageType,
  permissions: PermissionScope[]
): Promise<boolean> => {
  switch (type) {
    case BeaconMessageType.OperationRequest:
      return permissions.includes(PermissionScope.OPERATION_REQUEST)
    case BeaconMessageType.SignPayloadRequest:
      return permissions.includes(PermissionScope.SIGN)
    case BeaconMessageType.PermissionRequest:
    case BeaconMessageType.BroadcastRequest:
      return true
    default:
      return false
  }
}
