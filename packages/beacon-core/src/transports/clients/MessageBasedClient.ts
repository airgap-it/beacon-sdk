import { BEACON_VERSION } from '../../constants'
import {
  decryptCryptoboxPayload,
  encryptCryptoboxPayload,
  generateGUID,
  secretbox_NONCEBYTES,
  secretbox_MACBYTES
} from '@airgap/beacon-utils'
import { CommunicationClient } from './CommunicationClient'
import { PostMessagePairingRequest, PostMessagePairingResponse } from '@airgap/beacon-types'
import { KeyPair } from '@stablelib/ed25519'

/**
 * @internalapi
 *
 *
 */
export abstract class MessageBasedClient extends CommunicationClient {
  /**
   * The listeners that will be notified of new messages
   */
  protected abstract readonly activeListeners: Map<string, unknown>

  constructor(protected readonly name: string, keyPair: KeyPair) {
    super(keyPair)
    this.init().catch(console.error)
  }

  /**
   * start the client and make sure all dependencies are ready
   */
  public async start(): Promise<void> {
    await Promise.resolve()
  }

  /**
   * Get the pairing request information. This will be shared with the peer during the connection setup
   */
  public async getPairingRequestInfo(): Promise<PostMessagePairingRequest> {
    return {
      id: await generateGUID(),
      type: 'postmessage-pairing-request',
      name: this.name,
      version: BEACON_VERSION,
      publicKey: await this.getPublicKey()
    }
  }

  /**
   * Get the pairing response information. This will be shared with the peer during the connection setup
   */
  public async getPairingResponseInfo(
    request: PostMessagePairingRequest
  ): Promise<PostMessagePairingResponse> {
    return {
      id: request.id,
      type: 'postmessage-pairing-response',
      name: this.name,
      version: request.version,
      publicKey: await this.getPublicKey()
    }
  }

  /**
   * Unsubscribe from encrypted messages from a specific peer
   *
   * @param senderPublicKey
   */
  public async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    const listener = this.activeListeners.get(senderPublicKey)
    if (!listener) {
      return
    }

    this.activeListeners.delete(senderPublicKey)
  }

  /**
   * Unsubscribe from all encrypted messages
   */
  public async unsubscribeFromEncryptedMessages(): Promise<void> {
    this.activeListeners.clear()
  }

  /**
   * Decrypt a message from a specific peer
   *
   * @param senderPublicKey
   * @param payload
   */
  protected async decryptMessage(senderPublicKey: string, payload: string): Promise<string> {
    const sharedKey = await this.createCryptoBoxServer(senderPublicKey, this.keyPair)

    const hexPayload = Buffer.from(payload, 'hex')

    if (hexPayload.length >= secretbox_NONCEBYTES + secretbox_MACBYTES) {
      try {
        return await decryptCryptoboxPayload(hexPayload, sharedKey.receive)
      } catch (decryptionError) {
        /* NO-OP. We try to decode every message, but some might not be addressed to us. */
      }
    }

    throw new Error('Could not decrypt message')
  }

  /**
   * Encrypt a message for a specific publicKey (receiver)
   *
   * @param recipientPublicKey
   * @param message
   */
  protected async encryptMessage(recipientPublicKey: string, message: string): Promise<string> {
    const sharedKey = await this.createCryptoBoxClient(recipientPublicKey, this.keyPair)

    return encryptCryptoboxPayload(message, sharedKey.send)
  }

  /**
   * Initialize the connection
   */
  public abstract init(): Promise<void>
}
