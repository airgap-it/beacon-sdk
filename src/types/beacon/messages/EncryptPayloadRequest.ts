import { BeaconBaseMessage, BeaconMessageType, EncryptionOperation, EncryptionType } from '../../..'

/**
 * @category Message
 */
export interface EncryptPayloadRequest extends BeaconBaseMessage {
  type: BeaconMessageType.EncryptPayloadRequest
  cryptoOperation: EncryptionOperation // If the payload should be encrypted or decrypted
  encryptionType: EncryptionType // How the payload should be encrypted or decrypted.
  payload: string // The payload that will be encrypted or decrypted.
  sourceAddress: string // The user can specify an address that should be pre-selected in the wallet
}
