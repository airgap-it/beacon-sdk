import { hash } from '@stablelib/blake2b'
import * as bs58check from 'bs58check'

const isHex = (str: string): boolean => /^[A-F0-9]+$/i.test(str)

/**
 * @internalapi
 *
 * Generate a deterministic sender identifier based on a public key
 *
 * @param publicKey
 */
export const getSenderId = async (publicKey: string): Promise<string> => {
  if (!isHex(publicKey)) {
    console.error('PublicKey needs to be in hex format!')
  }

  const buffer = Buffer.from(hash(Buffer.from(publicKey, 'hex'), 5))

  return bs58check.encode(buffer)
}
