import { Network } from './beacon/Network'
import { PermissionScope } from './beacon/PermissionScope'

/**
 * @category DApp
 */
export interface RequestPermissionInput {
  /**
   * @deprecated You should now specify the network in the constructor of the DAppClient
   */
  network?: Network
  scopes?: PermissionScope[]
}
