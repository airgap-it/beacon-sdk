import { Network, PermissionScope } from '..'

/**
 * @category DApp
 */
export interface RequestPermissionInput {
  network?: Network
  scopes?: PermissionScope[]
}
