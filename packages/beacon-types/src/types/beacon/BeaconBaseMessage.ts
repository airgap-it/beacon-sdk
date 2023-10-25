import { BeaconMessageType } from '@mavrykdynamics/beacon-types'

/**
 * @category Message
 */
export interface BeaconBaseMessage {
  type: BeaconMessageType
  version: string
  id: string // ID of the message. The same ID is used in the request and response
  senderId: string // ID of the sender. This is used to identify the sender of the message. This should be the hash of the public key of the peer.
}
