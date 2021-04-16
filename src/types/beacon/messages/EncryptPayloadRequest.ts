import { BeaconBaseMessage, BeaconMessageType } from '../../..'

export enum EncryptionType {
  ENCRYPT_ASYMMETRIC = 0,
  DECRYPT_ASYMMETRIC = 1,
  ENCRYPT_SYMMETRIC = 2,
  DECRYPT_SYMMETRIC = 3
}

/**
 * @category Message
 */
export interface EncryptPayloadRequest extends BeaconBaseMessage {
  type: BeaconMessageType.EncryptPayloadRequest
  encryptionType: EncryptionType // How the payload should be encrypted or decrypted.
  payload: string // The payload that will be encrypted or decrypted.
  sourceAddress: string // The user can specify an address that should be pre-selected in the wallet
}
