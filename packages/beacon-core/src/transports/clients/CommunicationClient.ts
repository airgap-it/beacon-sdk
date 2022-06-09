import {
  KeyPair,
  CryptoKX,
  crypto_sign_ed25519_sk_to_curve25519,
  crypto_sign_ed25519_pk_to_curve25519,
  crypto_kx_client_session_keys
} from 'libsodium-wrappers'
import {
  P2PPairingRequest,
  ExtendedP2PPairingResponse,
  PostMessagePairingRequest,
  ExtendedPostMessagePairingResponse
} from '@airgap/beacon-types'
import { toHex, getHexHash, sealCryptobox } from '@airgap/beacon-utils'
import { precomputeSharedKey } from '@stablelib/nacl'
import { convertPublicKeyToX25519, convertSecretKeyToX25519 } from '@stablelib/ed25519'

/**
 * @internalapi
 *
 *
 */
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
  ): Promise<Uint8Array> {
    // const keys = await this.createCryptoBox(otherPublicKey, selfPrivateKey)
    console.log('CREATE CRYPTO BOX SERVER')
    console.log('CONVERTED PK', convertPublicKeyToX25519(Buffer.from(otherPublicKey, 'hex')))
    console.log('CONVERTED SK', convertSecretKeyToX25519(selfPrivateKey))
    console.log(
      'CONVERTED Shared Key',
      precomputeSharedKey(
        convertPublicKeyToX25519(Buffer.from(otherPublicKey, 'hex')),
        convertSecretKeyToX25519(selfPrivateKey)
      )
    )
    return precomputeSharedKey(
      convertPublicKeyToX25519(Buffer.from(otherPublicKey, 'hex')),
      convertSecretKeyToX25519(selfPrivateKey)
    )

    // return crypto_kx_server_session_keys(...keys)
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

  abstract unsubscribeFromEncryptedMessages(): Promise<void>
  abstract unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void>
  // abstract send(message: string, recipient?: string): Promise<void>
  public abstract sendMessage(
    message: string,
    peer?:
      | P2PPairingRequest
      | ExtendedP2PPairingResponse
      | PostMessagePairingRequest
      | ExtendedPostMessagePairingResponse
  ): Promise<void>
}
