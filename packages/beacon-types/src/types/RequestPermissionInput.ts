import { Network, PermissionScope } from '..'

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
