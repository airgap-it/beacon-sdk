import { Network, PermissionScope } from '..'

export interface RequestPermissionInput {
  network?: Network
  scopes?: PermissionScope[]
}
