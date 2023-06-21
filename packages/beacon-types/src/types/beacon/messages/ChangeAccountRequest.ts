import { BeaconBaseMessage, BeaconMessageType, Network, PermissionScope, Threshold } from "@airgap/beacon-types"
import { Notification } from '../../Notification'

export interface ChangeAccountRequest extends BeaconBaseMessage {
    type: BeaconMessageType.ChangeAccountRequest
    publicKey: string
    network: Network
    scopes: PermissionScope[]
    threshold?: Threshold
    notification?: Notification
}