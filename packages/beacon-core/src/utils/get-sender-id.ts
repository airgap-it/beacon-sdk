import { ready, crypto_generichash } from 'libsodium-wrappers'
import * as bs58check from 'bs58check'

/**
 * @internalapi
 *
 * Generate a deterministic sender identifier based on a public key
 *
 * @param publicKey
 */
export const getSenderId = async (publicKey: string): Promise<string> => {
  await ready

  const buffer = Buffer.from(crypto_generichash(5, Buffer.from(publicKey, 'hex')))

  return bs58check.encode(buffer)
}
