import {
  getAddressFromPublicKey,
  isValidAddress,
  prefixPublicKey,
  isPublicKeySC,
  toHex,
  getHexHash,
  getKeypairFromSeed,
  encryptCryptoboxPayload,
  decryptCryptoboxPayload,
  sealCryptobox,
  openCryptobox,
  recipientString,
  signMessage,
  encodePoeChallengePayload
} from '../../src/utils/crypto'

// Test vectors sourced from:
// - https://tezos.stackexchange.com/questions/4630/manually-calculate-tz1-address-from-privatte-key-mnemonic
// - https://blog.unit410.com/tezos/2019/05/28/encoding-tezos-ec-keys.html

describe('getAddressFromPublicKey', () => {
  describe('edpk (tz1)', () => {
    it('converts edpk public key to tz1 address', async () => {
      const publicKey = 'edpkuSLWfVU1Vq7Jg9FucPyKmma6otcMHac9zG4oU1KMHSTBpJuGQ2'
      const address = await getAddressFromPublicKey(publicKey)
      expect(address).toBe('tz1TGu6TN5GSez2ndXXeDX6LgUDvLzPLqgYV')
      expect(isValidAddress(address)).toBe(true)
    })
  })

  describe('sppk (tz2)', () => {
    it('converts sppk public key to tz2 address', async () => {
      const publicKey = 'sppk7czKu6So3zDWjhBPBv9wgCrBAfbEFoKYzEaKUsjhNr5Ug6E4Sn1'
      const address = await getAddressFromPublicKey(publicKey)
      expect(address).toBe('tz2Gsf1Q857wUzkNGzHsJNC98z881UutMwjg')
      expect(isValidAddress(address)).toBe(true)
    })
  })

  describe('p2pk (tz3)', () => {
    it('converts p2pk public key to tz3 address', async () => {
      const publicKey = 'p2pk67BANWUUX2fod9EQbv8ev7GGLpb4UXvLHEVVMiHBSWPHgyzf1tv'
      const address = await getAddressFromPublicKey(publicKey)
      expect(address).toBe('tz3daYfTrShLBfH24hv2kGwXD5y2bApH83RC')
      expect(isValidAddress(address)).toBe(true)
    })
  })

  describe('BLpk (tz4)', () => {
    it('converts BLpk public key to tz4 address', async () => {
      // This is the failing case from the bug report
      const publicKey = 'BLpk1zPXKmbZebsByVGqLej8k5ffsUmhfAKLR8xGphdRn7bptb61HdcBQ1gQ7NcrhAYoff1meYY4'
      const address = await getAddressFromPublicKey(publicKey)
      expect(address.startsWith('tz4')).toBe(true)
      expect(isValidAddress(address)).toBe(true)
    })

  })

  describe('raw hex public key', () => {
    it('converts 64-char hex public key to tz1 address', async () => {
      const hexKey = 'e8466d57c1d54e5a3f4ae33988eb5cbb5c7bb2fa30d0f347ccd30f53ac527a97'
      const address = await getAddressFromPublicKey(hexKey)
      expect(address.startsWith('tz1')).toBe(true)
      expect(isValidAddress(address)).toBe(true)
    })
  })

  describe('invalid keys', () => {
    it('throws for invalid public key', async () => {
      await expect(getAddressFromPublicKey('invalid')).rejects.toThrow('invalid publicKey')
    })
  })
})

describe('isPublicKeySC', () => {
  it('returns true for edpk keys', () => {
    expect(isPublicKeySC('edpkuSLWfVU1Vq7Jg9FucPyKmma6otcMHac9zG4oU1KMHSTBpJuGQ2')).toBe(true)
  })

  it('returns true for BLpk keys', () => {
    expect(isPublicKeySC('BLpk1zPXKmbZebsByVGqLej8k5ffsUmhfAKLR8xGphdRn7bptb61HdcBQ1gQ7NcrhAYoff1meYY4')).toBe(true)
  })

  it('returns false for invalid keys', () => {
    expect(isPublicKeySC('invalid')).toBe(false)
    expect(isPublicKeySC('')).toBe(false)
  })
})

describe('prefixPublicKey', () => {
  it('prefixes 64-char hex key with edpk', () => {
    const hexKey = 'e8466d57c1d54e5a3f4ae33988eb5cbb5c7bb2fa30d0f347ccd30f53ac527a97'
    const prefixed = prefixPublicKey(hexKey)
    expect(prefixed.startsWith('edpk')).toBe(true)
    expect(prefixed.length).toBe(54)
  })

  it('returns already-prefixed keys unchanged', () => {
    const edpk = 'edpkuBknW28nW72KG6RoHtYW7p12T6GKc7nAbwYX5m8Ber9eA26hQv'
    expect(prefixPublicKey(edpk)).toBe(edpk)
  })
})

describe('toHex', () => {
  it('converts string to hex', () => {
    expect(toHex('hello')).toBe('68656c6c6f')
  })

  it('converts Buffer to hex', () => {
    expect(toHex(Buffer.from([0x01, 0x02, 0x03]))).toBe('010203')
  })

  it('converts Uint8Array to hex', () => {
    expect(toHex(new Uint8Array([255, 0, 128]))).toBe('ff0080')
  })
})

describe('getHexHash', () => {
  it('hashes a string and returns hex', async () => {
    const hash = await getHexHash('test')
    expect(hash).toHaveLength(64) // 32 bytes = 64 hex chars
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('hashes a Buffer and returns hex', async () => {
    const hash = await getHexHash(Buffer.from('test'))
    expect(hash).toHaveLength(64)
  })

})

describe('recipientString', () => {
  it('formats Matrix recipient string correctly', () => {
    expect(recipientString('abc123', 'matrix.org')).toBe('@abc123:matrix.org')
  })
})


describe('getKeypairFromSeed', () => {
  it('generates a keypair from seed', async () => {
    const keypair = await getKeypairFromSeed('test seed')
    expect(keypair.publicKey).toBeInstanceOf(Uint8Array)
    expect(keypair.secretKey).toBeInstanceOf(Uint8Array)
    expect(keypair.publicKey).toHaveLength(32)
    expect(keypair.secretKey).toHaveLength(64)
  })

})

describe('symmetric encryption', () => {
  it('encrypts and decrypts a message with shared key', async () => {
    const keypair = await getKeypairFromSeed('test')
    const sharedKey = keypair.publicKey // Using public key as shared key for simplicity

    const message = 'Hello, World!'
    const encrypted = await encryptCryptoboxPayload(message, sharedKey)

    expect(encrypted).toMatch(/^[0-9a-f]+$/)
    expect(encrypted.length).toBeGreaterThan(message.length * 2) // Includes nonce + mac

    const decrypted = await decryptCryptoboxPayload(
      Buffer.from(encrypted, 'hex'),
      sharedKey
    )
    expect(decrypted).toBe(message)
  })

  it('throws on decryption with wrong key', async () => {
    const keypair1 = await getKeypairFromSeed('key1')
    const keypair2 = await getKeypairFromSeed('key2')

    const message = 'secret message'
    const encrypted = await encryptCryptoboxPayload(message, keypair1.publicKey)

    await expect(
      decryptCryptoboxPayload(Buffer.from(encrypted, 'hex'), keypair2.publicKey)
    ).rejects.toThrow('Decryption failed')
  })
})

describe('asymmetric encryption', () => {
  it('encrypts with public key and decrypts with private key', async () => {
    const keypair = await getKeypairFromSeed('asymmetric test')

    const message = 'Secret message for asymmetric encryption'
    const encrypted = await sealCryptobox(message, keypair.publicKey)

    expect(encrypted).toMatch(/^[0-9a-f]+$/)

    const decrypted = await openCryptobox(
      Buffer.from(encrypted, 'hex'),
      keypair.publicKey,
      keypair.secretKey
    )
    expect(decrypted).toBe(message)
  })

  it('works with Buffer payload', async () => {
    const keypair = await getKeypairFromSeed('buffer test')
    const message = Buffer.from('Buffer message')

    const encrypted = await sealCryptobox(message, keypair.publicKey)
    const decrypted = await openCryptobox(
      Buffer.from(encrypted, 'hex'),
      keypair.publicKey,
      keypair.secretKey
    )
    expect(decrypted).toBe('Buffer message')
  })

  it('throws on decryption with wrong private key', async () => {
    const keypair1 = await getKeypairFromSeed('sender')
    const keypair2 = await getKeypairFromSeed('wrong receiver')

    const encrypted = await sealCryptobox('secret', keypair1.publicKey)

    await expect(
      openCryptobox(
        Buffer.from(encrypted, 'hex'),
        keypair2.publicKey,
        keypair2.secretKey
      )
    ).rejects.toThrow('Decryption failed')
  })

})

describe('signMessage', () => {
  it('signs a message and returns edsig signature', async () => {
    const keypair = await getKeypairFromSeed('signing test')

    const signature = await signMessage('message to sign', {
      secretKey: Buffer.from(keypair.secretKey)
    })

    expect(signature.startsWith('edsig')).toBe(true)
    expect(signature.length).toBeGreaterThan(90)
  })

  it('handles hex input with 0x prefix', async () => {
    const keypair = await getKeypairFromSeed('hex signing')

    const signature = await signMessage('0x1234abcd', {
      secretKey: Buffer.from(keypair.secretKey)
    })

    expect(signature.startsWith('edsig')).toBe(true)
  })

  it('handles odd-length strings', async () => {
    const keypair = await getKeypairFromSeed('odd length')

    const signature = await signMessage('abc', {
      secretKey: Buffer.from(keypair.secretKey)
    })

    expect(signature.startsWith('edsig')).toBe(true)
  })
})

describe('isValidAddress', () => {
  it('validates tz1 addresses', () => {
    expect(isValidAddress('tz1TGu6TN5GSez2ndXXeDX6LgUDvLzPLqgYV')).toBe(true)
  })

  it('validates tz2 addresses', () => {
    expect(isValidAddress('tz2Gsf1Q857wUzkNGzHsJNC98z881UutMwjg')).toBe(true)
  })

  it('validates tz3 addresses', () => {
    expect(isValidAddress('tz3daYfTrShLBfH24hv2kGwXD5y2bApH83RC')).toBe(true)
  })

  it('validates tz4 addresses', () => {
    expect(isValidAddress('tz4HVR6aty9KwsQFHh81C1G7gBdhxT8kuytm')).toBe(true)
  })

  it('validates KT1 contract addresses', () => {
    expect(isValidAddress('KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn')).toBe(true)
  })

  it('rejects addresses with wrong prefix', () => {
    expect(isValidAddress('tz5invalid')).toBe(false)
    expect(isValidAddress('xx1TGu6TN5GSez2ndXXeDX6LgUDvLzPLqgYV')).toBe(false)
  })

  it('rejects addresses with invalid checksum', () => {
    // Modified last character to break checksum
    expect(isValidAddress('tz1TGu6TN5GSez2ndXXeDX6LgUDvLzPLqgYX')).toBe(false)
  })

  it('rejects empty and invalid strings', () => {
    expect(isValidAddress('')).toBe(false)
    expect(isValidAddress('invalid')).toBe(false)
  })
})

describe('encodePoeChallengePayload', () => {
  it('encodes a PoE challenge payload', () => {
    const encoded = encodePoeChallengePayload('test challenge')
    expect(encoded).toBeTruthy()
    expect(typeof encoded).toBe('string')
  })

})
