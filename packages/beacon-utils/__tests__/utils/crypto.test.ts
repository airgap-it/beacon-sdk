import bs58check from 'bs58check'
import { randomBytes } from '@stablelib/random'

import {
  toHex,
  getHexHash,
  getKeypairFromSeed,
  encryptCryptoboxPayload,
  decryptCryptoboxPayload,
  sealCryptobox,
  openCryptobox,
  getAddressFromPublicKey,
  prefixPublicKey,
  recipientString,
  signMessage,
  isValidAddress,
  encodePoeChallengePayload,
  isPublicKeySC
} from '../../src/utils/crypto' // Adjust the path to your crypto module

describe('Crypto Module', () => {
  describe('toHex', () => {
    it('should convert a Buffer to a hex string', () => {
      const input = Buffer.from('hello')
      expect(toHex(input)).toBe(input.toString('hex'))
    })
  })

  describe('getHexHash', () => {
    it('should return a 64-character hex hash for a string input', async () => {
      const hashValue = await getHexHash('hello')
      // 32 bytes hash gives 64 hex characters
      expect(hashValue).toHaveLength(64)
    })

    it('should return a 64-character hex hash for a Buffer input', async () => {
      const hashValue = await getHexHash(Buffer.from('hello'))
      expect(hashValue).toHaveLength(64)
    })
  })

  describe('getKeypairFromSeed', () => {
    it('should return a keypair object with publicKey and secretKey as Uint8Arrays', async () => {
      const seed = 'test seed'
      const keypair = await getKeypairFromSeed(seed)
      expect(keypair).toHaveProperty('publicKey')
      expect(keypair).toHaveProperty('secretKey')
      expect(keypair.publicKey).toBeInstanceOf(Uint8Array)
      expect(keypair.secretKey).toBeInstanceOf(Uint8Array)
    })
  })

  describe('encryptCryptoboxPayload and decryptCryptoboxPayload', () => {
    it('should correctly encrypt and then decrypt a message with a shared key', async () => {
      const sharedKey = randomBytes(32)
      const message = 'Hello, world!'
      const encryptedHex = await encryptCryptoboxPayload(message, sharedKey)

      // For decryption, convert the hex string back to a Uint8Array
      const encryptedPayload = Uint8Array.from(Buffer.from(encryptedHex, 'hex'))
      const decrypted = await decryptCryptoboxPayload(encryptedPayload, sharedKey)
      expect(decrypted).toBe(message)
    })
  })

  describe('sealCryptobox and openCryptobox', () => {
    it('should seal a message for a recipient and then open (decrypt) it', async () => {
      // Generate a recipient keypair from a seed
      const seed = 'recipient seed'
      const recipientKeypair = await getKeypairFromSeed(seed)
      const message = 'Confidential message'

      // Seal the message using the recipient's public key. sealCryptobox returns a hex string.
      const sealed = await sealCryptobox(message, recipientKeypair.publicKey)
      // Convert the hex string to Uint8Array before passing to openCryptobox
      const sealedPayload: any = Uint8Array.from(Buffer.from(sealed, 'hex'))
      const decrypted = await openCryptobox(
        sealedPayload,
        recipientKeypair.publicKey,
        recipientKeypair.secretKey
      )
      expect(decrypted).toBe(message)
    })

    it('should throw an error if decryption fails', async () => {
      const seed = 'recipient seed'
      const recipientKeypair = await getKeypairFromSeed(seed)
      // Create an invalid payload (random bytes) that should not decrypt correctly
      const invalidPayload: any = Uint8Array.from(randomBytes(100))
      await expect(
        openCryptobox(invalidPayload, recipientKeypair.publicKey, recipientKeypair.secretKey)
      ).rejects.toThrow('Decryption failed')
    })
  })

  describe('getAddressFromPublicKey', () => {
    it('should derive an address from a hex public key', async () => {
      // Get a keypair and convert the public key to hex correctly
      const seed = 'address seed'
      const keypair = await getKeypairFromSeed(seed)
      const hexPublicKey = Buffer.from(keypair.publicKey).toString('hex')

      const address = await getAddressFromPublicKey(hexPublicKey)
      expect(address).toBeDefined()

      // Verify the decoded address starts with the expected prefix for edpk (which is [6, 161, 159])
      const decoded = bs58check.decode(address)
      const expectedPrefix = Buffer.from([6, 161, 159])
      // Convert both to arrays for deep equality check
      expect(Array.from(decoded.slice(0, 3))).toEqual(Array.from(expectedPrefix))
    })

    it('should throw an error for an invalid public key', async () => {
      await expect(getAddressFromPublicKey('invalidPublicKey')).rejects.toThrow('invalid publicKey')
    })
  })

  describe('prefixPublicKey', () => {
    it('should prefix a 64-character hex public key', () => {
      const hexKey = 'a'.repeat(64)
      const prefixed = prefixPublicKey(hexKey)
      const decoded = bs58check.decode(prefixed)
      // The expected prefix for a hex key is [13, 15, 37, 217]
      const expectedPrefix = [13, 15, 37, 217]
      expect(Array.from(decoded.slice(0, 4))).toEqual(expectedPrefix)
    })

    it('should return the input unchanged if the public key is already prefixed', () => {
      const nonHexKey = 'edpk123456789' // Example of an already prefixed key
      expect(prefixPublicKey(nonHexKey)).toBe(nonHexKey)
    })
  })

  describe('recipientString', () => {
    it('should format the recipient string correctly', () => {
      const result = recipientString('recipientHash', 'relayServer')
      expect(result).toBe('@recipientHash:relayServer')
    })
  })

  describe('signMessage', () => {
    it('should sign a message and return a signature with the expected prefix', async () => {
      const seed = 'sign seed'
      const keypair: any = await getKeypairFromSeed(seed)
      const message = 'Test message'
      const signature = await signMessage(message, keypair)
      // Typically, a Tezos edsig starts with 'edsig'
      expect(signature).toMatch(/^edsig/)
    })
  })

  describe('isValidAddress', () => {
    it('should return true for a valid address', async () => {
      const seed = 'valid address seed'
      const keypair = await getKeypairFromSeed(seed)
      const hexPublicKey = Buffer.from(keypair.publicKey).toString('hex')
      const address = await getAddressFromPublicKey(hexPublicKey)
      expect(isValidAddress(address)).toBe(true)
    })

    it('should return false for an invalid address', () => {
      expect(isValidAddress('invalidaddress')).toBe(false)
    })
  })

  describe('encodePoeChallengePayload', () => {
    it('should encode the payload with the correct POE challenge prefix and length', () => {
      const payload = 'challenge'
      const encoded = encodePoeChallengePayload(payload)
      const decoded = bs58check.decode(encoded)
      // The first byte should be the POE_CHALLENGE_PREFIX (110)
      expect(decoded[0]).toBe(110)
      // The total length should be 1 (prefix) + 20 (hash length) = 21 bytes
      expect(decoded.length).toBe(21)
    })
  })

  describe('isPublicKeySC', () => {
    it('should return true for public keys with known prefixes', () => {
      expect(isPublicKeySC('edpkSample')).toBe(true)
      expect(isPublicKeySC('sppkSample')).toBe(true)
      expect(isPublicKeySC('p2pkSample')).toBe(true)
      expect(isPublicKeySC('BLpkSample')).toBe(true)
    })

    it('should return false for invalid or empty public keys', () => {
      expect(isPublicKeySC('')).toBe(false)
      expect(isPublicKeySC('abc')).toBe(false)
    })
  })
})
