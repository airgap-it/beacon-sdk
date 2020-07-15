import * as sodium from 'libsodium-wrappers'
import { PostMessagePairingRequest } from '../types/PostMessagePairingRequest'
import { decryptCryptoboxPayload, encryptCryptoboxPayload } from '../utils/crypto'
import { CommunicationClient } from './CommunicationClient'

export abstract class MessageBasedClient extends CommunicationClient {
  protected abstract readonly activeListeners: Map<string, unknown> = new Map()

  constructor(
    protected readonly name: string,
    keyPair: sodium.KeyPair,
    protected readonly debug: boolean = true
  ) {
    super(keyPair)
    this.init().catch(console.error)
  }

  public async start(): Promise<void> {
    await sodium.ready
  }

  public async getHandshakeInfo(): Promise<PostMessagePairingRequest> {
    return {
      name: this.name,
      publicKey: await this.getPublicKey()
    }
  }

  public async isListeningToPublicKey(publicKey: string): Promise<boolean> {
    const listener = this.activeListeners.get(publicKey)

    return Boolean(listener)
  }

  public async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    const listener = this.activeListeners.get(senderPublicKey)
    if (!listener) {
      return
    }

    this.activeListeners.delete(senderPublicKey)
  }

  public async unsubscribeFromEncryptedMessages(): Promise<void> {
    this.activeListeners.clear()
  }

  protected async decryptMessage(senderPublicKey: string, payload: string): Promise<string> {
    const { sharedRx } = await this.createCryptoBoxServer(senderPublicKey, this.keyPair.privateKey)

    const hexPayload = Buffer.from(payload, 'hex')

    if (
      hexPayload.length >=
      sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES
    ) {
      try {
        return decryptCryptoboxPayload(hexPayload, sharedRx)
      } catch (decryptionError) {
        /* NO-OP. We try to decode every message, but some might not be addressed to us. */
      }
    }

    throw new Error('Could not decrypt message')
  }

  protected async encryptMessage(recipientPublicKey: string, message: string): Promise<string> {
    const { sharedTx } = await this.createCryptoBoxClient(
      recipientPublicKey,
      this.keyPair.privateKey
    )

    return encryptCryptoboxPayload(message, sharedTx)
  }

  public abstract async init(): Promise<void>
}
