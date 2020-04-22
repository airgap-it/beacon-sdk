import { BeaconMessageType } from '../..'

export interface BeaconBaseMessage {
  type: BeaconMessageType
  version: string
  id: string // ID of the message. The same ID is used in the request and response
  beaconId: string // ID of the sender. This is used to identify the sender of the message
  // TODO: The beaconID (which is a public key) can be used to verify a signature and prevent message spoofing
}
