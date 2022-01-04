import { BeaconBaseMessage } from '@airgap/beacon-types'

export interface PermissionRequestV3<T extends string> extends BeaconBaseMessage {
  blockchainIdentifier: T
  payload: any
}
