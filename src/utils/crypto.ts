import * as bs58check from 'bs58check'
import * as sodium from 'libsodium-wrappers'

/* eslint-disable prefer-arrow/prefer-arrow-functions */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toHex(value: any): string {
  return Buffer.from(value).toString('hex')
}

export async function getHexHash(key: string | Buffer | Uint8Array): Promise<string> {
  await sodium.ready

  return toHex(sodium.crypto_generichash(32, key))
}

export async function getKeypairFromSeed(seed: string): Promise<sodium.KeyPair> {
  await sodium.ready

  return sodium.crypto_sign_seed_keypair(sodium.crypto_generichash(32, sodium.from_string(seed)))
}

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

export async function sealCryptobox(
  payload: string | Buffer,
  publicKey: Uint8Array
): Promise<string> {
  await sodium.ready

  const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(Buffer.from(publicKey)) // Secret bytes to scalar bytes
  const encryptedMessage = sodium.crypto_box_seal(payload, kxSelfPublicKey)

  return toHex(encryptedMessage)
}

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

export async function getAddressFromPublicKey(publicKey: string): Promise<string> {
  await sodium.ready

  let plainPublicKey: string
  if (publicKey.length === 64) {
    plainPublicKey = publicKey
  } else if (publicKey.startsWith('edpk') && publicKey.length === 54) {
    const edpkPrefixLength = 4
    const decoded = bs58check.decode(publicKey)

    plainPublicKey = decoded.slice(edpkPrefixLength, decoded.length).toString('hex')
  } else {
    throw new Error(`invalid publicKey: ${publicKey}`)
  }

  const payload: Uint8Array = sodium.crypto_generichash(20, Buffer.from(plainPublicKey, 'hex'))
  const tz1Prefix: Buffer = Buffer.from(new Uint8Array([6, 161, 159]))

  return bs58check.encode(Buffer.concat([tz1Prefix, Buffer.from(payload)]))
}

export function recipientString(recipientHash: string, relayServer: string): string {
  return `@${recipientHash}:${relayServer}`
}

/* eslint-enable prefer-arrow/prefer-arrow-functions */
