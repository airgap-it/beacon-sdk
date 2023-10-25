import { BeaconBaseMessage, BeaconMessageType, SigningType } from '@mavrykdynamics/beacon-types'

/**
 * @category Message
 */
export interface SignPayloadResponse extends BeaconBaseMessage {
  type: BeaconMessageType.SignPayloadResponse
  signingType: SigningType
  signature: string // Signature of the payload
}
