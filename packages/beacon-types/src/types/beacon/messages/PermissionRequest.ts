import {
  BeaconBaseMessage,
  BeaconMessageType,
  PermissionScope,
  AppMetadata,
  Network
} from '@mavrykdynamics/beacon-types'

/**
 * @category Message
 */
export interface PermissionRequest extends BeaconBaseMessage {
  type: BeaconMessageType.PermissionRequest
  appMetadata: AppMetadata // Some additional information about the DApp
  network: Network // Network on which the permissions are requested. Only one network can be specified. In case you need permissions on multiple networks, you need to request permissions multiple times
  scopes: PermissionScope[] // The permission scopes that the DApp is asking for
}
