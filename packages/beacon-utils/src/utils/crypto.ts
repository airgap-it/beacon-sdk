import * as bs58check from 'bs58check'
import {
  ready,
  crypto_generichash,
  crypto_sign_seed_keypair,
  from_string,
  KeyPair,
  randombytes_buf,
  crypto_secretbox_NONCEBYTES,
  crypto_secretbox_easy,
  crypto_secretbox_open_easy,
  crypto_sign_ed25519_pk_to_curve25519,
  crypto_sign_ed25519_sk_to_curve25519,
  crypto_box_seal,
  crypto_box_seal_open,
  crypto_sign_detached
} from 'libsodium-wrappers'

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
  await ready

  return toHex(crypto_generichash(32, key))
}

/**
 * Get a keypair from a seed
 *
 * @param seed
 */
export async function getKeypairFromSeed(seed: string): Promise<KeyPair> {
  await ready

  return crypto_sign_seed_keypair(crypto_generichash(32, from_string(seed)))
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
  await ready

  const nonce = Buffer.from(randombytes_buf(crypto_secretbox_NONCEBYTES))
  const combinedPayload = Buffer.concat([
    nonce,
    Buffer.from(crypto_secretbox_easy(Buffer.from(message, 'utf8'), nonce, sharedKey))
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
  await ready

  const nonce = payload.slice(0, crypto_secretbox_NONCEBYTES)
  const ciphertext = payload.slice(crypto_secretbox_NONCEBYTES)

  return Buffer.from(crypto_secretbox_open_easy(ciphertext, nonce, sharedKey)).toString('utf8')
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
  await ready

  const kxSelfPublicKey = crypto_sign_ed25519_pk_to_curve25519(Buffer.from(publicKey)) // Secret bytes to scalar bytes
  const encryptedMessage = crypto_box_seal(payload, kxSelfPublicKey)

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
  await ready

  const kxSelfPrivateKey = crypto_sign_ed25519_sk_to_curve25519(Buffer.from(privateKey)) // Secret bytes to scalar bytes
  const kxSelfPublicKey = crypto_sign_ed25519_pk_to_curve25519(Buffer.from(publicKey)) // Secret bytes to scalar bytes

  const decryptedMessage = crypto_box_seal_open(encryptedPayload, kxSelfPublicKey, kxSelfPrivateKey)

  return Buffer.from(decryptedMessage).toString()
}

/**
 * Get an address from the public key
 *
 * @param publicKey
 */
export async function getAddressFromPublicKey(publicKey: string): Promise<string> {
  await ready

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

  const payload: Uint8Array = crypto_generichash(20, Buffer.from(plainPublicKey, 'hex'))

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

const toBuffer = async (message: string): Promise<Uint8Array> => {
  if (message.length % 2 !== 0) {
    return from_string(message)
  }

  let adjustedMessage = message

  if (message.startsWith('0x')) {
    adjustedMessage = message.slice(2)
  }

  const buffer = Buffer.from(adjustedMessage, 'hex')

  if (buffer.length === adjustedMessage.length / 2) {
    return buffer
  }

  return from_string(message)
}

const coinlibhash = async (message: Uint8Array, size: number = 32): Promise<Uint8Array> => {
  await ready

  return crypto_generichash(size, message)
}

export const signMessage = async (
  message: string,
  keypair: { privateKey: Buffer }
): Promise<string> => {
  await ready

  const bufferMessage: Uint8Array = await toBuffer(message)

  const edsigPrefix: Uint8Array = new Uint8Array([9, 245, 205, 134, 18])

  const hash: Uint8Array = await coinlibhash(bufferMessage)
  const rawSignature: Uint8Array = crypto_sign_detached(hash, keypair.privateKey)
  const signature: string = bs58check.encode(
    Buffer.concat([Buffer.from(edsigPrefix), Buffer.from(rawSignature)])
  )

  return signature
}

/* eslint-enable prefer-arrow/prefer-arrow-functions */
