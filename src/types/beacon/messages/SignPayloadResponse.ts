import { BeaconBaseMessage, BeaconMessageType } from '../../..'

export interface SignPayloadResponse extends BeaconBaseMessage {
  type: BeaconMessageType.SignPayloadResponse
  signature: string // Signature of the payload
}
