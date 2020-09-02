import * as sodium from 'libsodium-wrappers'
import { toHex, getHexHash } from '../../utils/crypto'

export abstract class CommunicationClient {
  constructor(protected readonly keyPair: sodium.KeyPair) {}

  /**
   * Get the public key
   */
  public async getPublicKey(): Promise<string> {
    return toHex(this.keyPair.publicKey)
  }

  /**
   * get the public key hash
   */
  public async getPublicKeyHash(): Promise<string> {
    return getHexHash(this.keyPair.publicKey)
  }

  /**
   * Create a cryptobox shared key
   *
   * @param otherPublicKey
   * @param selfPrivateKey
   */
  protected async createCryptoBox(
    otherPublicKey: string,
    selfPrivateKey: Uint8Array
  ): Promise<[Uint8Array, Uint8Array, Uint8Array]> {
    // TODO: Don't calculate it every time?
    const kxSelfPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(
      Buffer.from(selfPrivateKey)
    ) // Secret bytes to scalar bytes
    const kxSelfPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(
      Buffer.from(selfPrivateKey).slice(32, 64)
    ) // Secret bytes to scalar bytes
    const kxOtherPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(
      Buffer.from(otherPublicKey, 'hex')
    ) // Secret bytes to scalar bytes

    return [
      Buffer.from(kxSelfPublicKey),
      Buffer.from(kxSelfPrivateKey),
      Buffer.from(kxOtherPublicKey)
    ]
  }

  /**
   * Create a cryptobox server
   *
   * @param otherPublicKey
   * @param selfPrivateKey
   */
  protected async createCryptoBoxServer(
    otherPublicKey: string,
    selfPrivateKey: Uint8Array
  ): Promise<sodium.CryptoKX> {
    const keys = await this.createCryptoBox(otherPublicKey, selfPrivateKey)

    return sodium.crypto_kx_server_session_keys(...keys)
  }

  /**
   * Create a cryptobox client
   *
   * @param otherPublicKey
   * @param selfPrivateKey
   */
  protected async createCryptoBoxClient(
    otherPublicKey: string,
    selfPrivateKey: Uint8Array
  ): Promise<sodium.CryptoKX> {
    const keys = await this.createCryptoBox(otherPublicKey, selfPrivateKey)

    return sodium.crypto_kx_client_session_keys(...keys)
  }
}
