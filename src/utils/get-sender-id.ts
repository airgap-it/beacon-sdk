import * as sodium from 'libsodium-wrappers'
import * as bs58check from 'bs58check'

/**
 * Generate a deterministic sender identifier based on a public key
 *
 * @param publicKey
 */
export const getSenderId = async (publicKey: string): Promise<string> => {
  await sodium.ready

  const buffer = Buffer.from(sodium.crypto_generichash(5, Buffer.from(publicKey, 'hex')))

  return bs58check.encode(buffer)
}
