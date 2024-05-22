import { randomBytes } from '@stablelib/random'
import { SHA256 } from '@stablelib/sha256'
import { ec as EC } from 'elliptic'

export class Crypto {
  public getRandomValues(size: number): Uint8Array {
    return randomBytes(size)
  }

  public sha256(data: Uint8Array): Uint8Array {
    const sha256 = new SHA256()
    sha256.update(data)
    return sha256.digest()
  }

  public compressP256PublicKey(publicKey: Uint8Array): Uint8Array {
    const ec = new EC('p256')
    const compressedPublicKey: string = ec.keyFromPublic(publicKey).getPublic(true, 'hex')

    return Buffer.from(compressedPublicKey, 'hex')
  }

  public signP256(data: Uint8Array, secretKey: Uint8Array): Uint8Array {
    const ec = new EC('p256')
    const signature = ec.keyFromPrivate(secretKey).sign(data)

    return Buffer.concat([
      signature.r.toArrayLike(Buffer, 'be', 32),
      signature.s.toArrayLike(Buffer, 'be', 32)
    ])
  }
}