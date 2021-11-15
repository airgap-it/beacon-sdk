import * as bs58check from 'bs58check'
import sodium from 'libsodium-wrappers'

/* eslint-disable prefer-arrow/prefer-arrow-functions */

/**
 * Convert a value to hex
 *
 * @param value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toHex(value: any): string {
  return Buffer.from(value).toString('hex')
}

/**
 * Get the hex hash of a value
 *
 * @param key
 */
export async function getHexHash(key: string | Buffer | Uint8Array): Promise<string> {
  await sodium.ready

  return toHex(sodium.crypto_generichash(32, key))
}

/**
 * Get a keypair from a seed
 *
 * @param seed
 */
export async function getKeypairFromSeed(seed: string): Promise<sodium.KeyPair> {
  await sodium.ready

  return sodium.crypto_sign_seed_keypair(sodium.crypto_generichash(32, sodium.from_string(seed)))
}

/**
 * Encrypt a message with a shared key
 *
 * @param message
 * @param sharedKey
 */
export async function encryptCryptoboxPayload(
  message: string,
  sharedKey: Uint8Array
): Promise<string> {
  await sodium.ready

  const nonce = Buffer.from(sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES))
  const combinedPayload = Buffer.concat([
    nonce,
    Buffer.from(sodium.crypto_secretbox_easy(Buffer.from(message, 'utf8'), nonce, sharedKey))
  ])

  return toHex(combinedPayload)
}

/**
 * Decrypt a message with a shared key
 *
 * @param payload
 * @param sharedKey
 */
export async function decryptCryptoboxPayload(
  payload: Uint8Array,
  sharedKey: Uint8Array
): Promise<string> {
  await sodium.ready

  const nonce = payload.slice(0, sodium.crypto_secretbox_NONCEBYTES)
  const ciphertext = payload.slice(sodium.crypto_secretbox_NONCEBYTES)

  return Buffer.from(sodium.crypto_secretbox_open_easy(ciphertext, nonce, sharedKey)).toString(
    'utf8'
  )
}

/**
 * Encrypt a message with a public key
 *
 * @param payload
 * @param publicKey
 */
export async function sealCryptobox(
  payload: string | Buffer,
  publicKey: Uint8Array
): Promise<string> {
  await sodium.ready

  const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(publicKey)) // Secret bytes to scalar bytes
  const encryptedMessage = sodium.crypto_box_seal(payload, kxSelfPublicKey)

  return toHex(encryptedMessage)
}

/**
 * Decrypt a message with public + private key
 *
 * @param encryptedPayload
 * @param publicKey
 * @param privateKey
 */
export async function openCryptobox(
  encryptedPayload: string | Buffer,
  publicKey: Uint8Array,
  privateKey: Uint8Array
): Promise<string> {
  await sodium.ready

  const kxSelfPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(Buffer.from(privateKey)) // Secret bytes to scalar bytes
  const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(publicKey)) // Secret bytes to scalar bytes

  const decryptedMessage = sodium.crypto_box_seal_open(
    encryptedPayload,
    kxSelfPublicKey,
    kxSelfPrivateKey
  )

  return Buffer.from(decryptedMessage).toString()
}

/**
 * Get an address from the public key
 *
 * @param publicKey
 */
export async function getAddressFromPublicKey(publicKey: string): Promise<string> {
  await sodium.ready

  const prefixes = {
    // tz1...
    edpk: {
      length: 54,
      prefix: Buffer.from(new Uint8Array([6, 161, 159]))
    },
    // tz2...
    sppk: {
      length: 55,
      prefix: Buffer.from(new Uint8Array([6, 161, 161]))
    },
    // tz3...
    p2pk: {
      length: 55,
      prefix: Buffer.from(new Uint8Array([6, 161, 164]))
    }
  }

  let prefix: Buffer | undefined
  let plainPublicKey: string | undefined
  if (publicKey.length === 64) {
    prefix = prefixes.edpk.prefix
    plainPublicKey = publicKey
  } else {
    const entries = Object.entries(prefixes)
    for (let index = 0; index < entries.length; index++) {
      const [key, value] = entries[index]
      if (publicKey.startsWith(key) && publicKey.length === value.length) {
        prefix = value.prefix
        const decoded = bs58check.decode(publicKey)
        plainPublicKey = decoded.slice(key.length, decoded.length).toString('hex')
        break
      }
    }
  }

  if (!prefix || !plainPublicKey) {
    throw new Error(`invalid publicKey: ${publicKey}`)
  }

  const payload: Uint8Array = sodium.crypto_generichash(20, Buffer.from(plainPublicKey, 'hex'))

  return bs58check.encode(Buffer.concat([prefix, Buffer.from(payload)]))
}

/**
 * Get the recipient string used in the matrix message
 *
 * @param recipientHash
 * @param relayServer
 */
export function recipientString(recipientHash: string, relayServer: string): string {
  return `@${recipientHash}:${relayServer}`
}

/* eslint-enable prefer-arrow/prefer-arrow-functions */
