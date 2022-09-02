import * as bs58check from 'bs58check'
import { ready, crypto_box_seal, crypto_box_seal_open } from 'libsodium-wrappers'
import { box, openBox, openSecretBox, secretBox } from '@stablelib/nacl'
import { randomBytes } from '@stablelib/random'
import { encode } from '@stablelib/utf8'
import { hash } from '@stablelib/blake2b'
import { generateKeyPairFromSeed } from '@stablelib/ed25519'
import { convertPublicKeyToX25519, convertSecretKeyToX25519, KeyPair } from '@stablelib/ed25519'

export const secretbox_NONCEBYTES = 24 // crypto_secretbox_NONCEBYTES
export const secretbox_MACBYTES = 16 // crypto_secretbox_MACBYTES

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
  if (typeof key === 'string') {
    return toHex(hash(encode(key), 32))
  }

  return toHex(hash(key, 32))
}

/**
 * Get a keypair from a seed
 *
 * @param seed
 */
export async function getKeypairFromSeed(seed: string): Promise<KeyPair> {
  return generateKeyPairFromSeed(hash(encode(seed), 32))
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
  const nonce = Buffer.from(randomBytes(secretbox_NONCEBYTES))

  const combinedPayload = Buffer.concat([
    nonce,
    Buffer.from(secretBox(sharedKey, nonce, Buffer.from(message, 'utf8')))
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
  const nonce = payload.slice(0, secretbox_NONCEBYTES)
  const ciphertext = payload.slice(secretbox_NONCEBYTES)

  const openBox = openSecretBox(sharedKey, nonce, ciphertext)

  if (!openBox) {
    throw new Error('Decryption failed')
  }

  return Buffer.from(openBox).toString('utf8')
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
  console.log('---------YYYY----------')

  const kxSelfPublicKey = convertPublicKeyToX25519(Buffer.from(publicKey)) // Secret bytes to scalar bytes
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
  console.log('---------AAAAA----------')

  const kxSelfPrivateKey = convertSecretKeyToX25519(Buffer.from(privateKey)) // Secret bytes to scalar bytes
  const kxSelfPublicKey = convertPublicKeyToX25519(Buffer.from(publicKey)) // Secret bytes to scalar bytes

  // box(kxSelfPublicKey, kxSelfPrivateKey, new Uint8Array([1]), encryptedPayload)

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

  const payload: Uint8Array = hash(Buffer.from(plainPublicKey, 'hex'), 20)

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
