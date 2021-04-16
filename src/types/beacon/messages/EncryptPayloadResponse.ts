import { BeaconBaseMessage, BeaconMessageType, EncryptionType } from '../../..'

/**
 * @category Message
 */
export interface EncryptPayloadResponse extends BeaconBaseMessage {
  type: BeaconMessageType.EncryptPayloadResponse
  encryptionType: EncryptionType // How the payload should be encrypted or decrypted.
  payload: string // The payload that will be encrypted or decrypted.
}
