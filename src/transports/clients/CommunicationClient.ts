import {
  KeyPair,
  CryptoKX,
  crypto_sign_ed25519_sk_to_curve25519,
  crypto_sign_ed25519_pk_to_curve25519,
  crypto_kx_server_session_keys,
  crypto_kx_client_session_keys
} from 'libsodium-wrappers'
import { P2PPairingRequest } from '../..'
import { ExtendedP2PPairingResponse } from '../../types/P2PPairingResponse'
import { PostMessagePairingRequest } from '../../types/PostMessagePairingRequest'
import { ExtendedPostMessagePairingResponse } from '../../types/PostMessagePairingResponse'
import { toHex, getHexHash, sealCryptobox } from '../../utils/crypto'

export abstract class CommunicationClient {
  constructor(protected readonly keyPair: KeyPair) {}

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
    const kxSelfPrivateKey = crypto_sign_ed25519_sk_to_curve25519(Buffer.from(selfPrivateKey)) // Secret bytes to scalar bytes
    const kxSelfPublicKey = crypto_sign_ed25519_pk_to_curve25519(
      Buffer.from(selfPrivateKey).slice(32, 64)
    ) // Secret bytes to scalar bytes
    const kxOtherPublicKey = crypto_sign_ed25519_pk_to_curve25519(
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
  ): Promise<CryptoKX> {
    const keys = await this.createCryptoBox(otherPublicKey, selfPrivateKey)

    return crypto_kx_server_session_keys(...keys)
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
  ): Promise<CryptoKX> {
    const keys = await this.createCryptoBox(otherPublicKey, selfPrivateKey)

    return crypto_kx_client_session_keys(...keys)
  }

  /**
   * Encrypt a message for a specific publicKey (receiver, asymmetric)
   *
   * @param recipientPublicKey
   * @param message
   */
  protected async encryptMessageAsymmetric(
    recipientPublicKey: string,
    message: string
  ): Promise<string> {
    return sealCryptobox(message, Buffer.from(recipientPublicKey, 'hex'))
  }

  abstract async unsubscribeFromEncryptedMessages(): Promise<void>
  abstract async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void>
  // abstract async send(message: string, recipient?: string): Promise<void>
  public abstract async sendMessage(
    message: string,
    peer?:
      | P2PPairingRequest
      | ExtendedP2PPairingResponse
      | PostMessagePairingRequest
      | ExtendedPostMessagePairingResponse
  ): Promise<void>
}
