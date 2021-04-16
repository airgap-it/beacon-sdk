import { EncryptionType } from './beacon/messages/EncryptPayloadRequest'

/**
 * @category DApp
 */
export interface RequestEncryptPayloadInput {
  encryptionType?: EncryptionType
  payload: string
  sourceAddress?: string
}
