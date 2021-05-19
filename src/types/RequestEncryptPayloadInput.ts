import { EncryptionOperation, EncryptionType } from '..'

/**
 * @category DApp
 */
export interface RequestEncryptPayloadInput {
  encryptionCryptoOperation: EncryptionOperation
  encryptionType: EncryptionType
  payload: string
  sourceAddress?: string
}
