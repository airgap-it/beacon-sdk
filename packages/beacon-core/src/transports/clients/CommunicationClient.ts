import {
  P2PPairingRequest,
  ExtendedP2PPairingResponse,
  PostMessagePairingRequest,
  ExtendedPostMessagePairingResponse
} from '@airgap/beacon-types'
import { toHex, getHexHash, sealCryptobox } from '@airgap/beacon-utils'
import { convertPublicKeyToX25519, convertSecretKeyToX25519, KeyPair } from '@stablelib/ed25519'
import { clientSessionKeys, serverSessionKeys, SessionKeys } from '@stablelib/x25519-session'
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
   * Create a cryptobox server
   *
   * @param otherPublicKey
   * @param selfKeypair
   */
  protected async createCryptoBoxServer(
    otherPublicKey: string,
    selfKeypair: KeyPair
  ): Promise<SessionKeys> {
    return serverSessionKeys(
      {
        publicKey: convertPublicKeyToX25519(selfKeypair.publicKey),
        secretKey: convertSecretKeyToX25519(selfKeypair.secretKey)
      },
      convertPublicKeyToX25519(Buffer.from(otherPublicKey, 'hex'))
    )
  }

  /**
   * Create a cryptobox client
   *
   * @param otherPublicKey
   * @param selfKeypair
   */
  protected async createCryptoBoxClient(
    otherPublicKey: string,
    selfKeypair: KeyPair
  ): Promise<SessionKeys> {
    return clientSessionKeys(
      {
        publicKey: convertPublicKeyToX25519(selfKeypair.publicKey),
        secretKey: convertSecretKeyToX25519(selfKeypair.secretKey)
      },
      convertPublicKeyToX25519(Buffer.from(otherPublicKey, 'hex'))
    )
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
