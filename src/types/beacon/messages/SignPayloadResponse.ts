import { BeaconBaseMessage, BeaconMessageType, SigningType } from '../../..'

export interface SignPayloadResponse extends BeaconBaseMessage {
  type: BeaconMessageType.SignPayloadResponse
  signingType: SigningType
  signature: string // Signature of the payload
}
