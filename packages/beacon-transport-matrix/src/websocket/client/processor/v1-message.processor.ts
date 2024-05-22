import { Crypto } from '../../crypto'
import { type Message } from '../../message/messages'
import { type AcceptedMessage, type ChallengeMessage, type PayloadMessage, createInitMessage, createPayloadMessage, createResponseMessage } from '../../message/v1-messages'

import { type KeyPair } from '../types'

import { type ProcessorAction, type MessageProcessor } from './message-processor'

export class V1MessageProcessor implements MessageProcessor {
  public constructor(
    private readonly sender: Uint8Array,
    private readonly crypto: Crypto = new Crypto()
  ) {}

  public async init(): Promise<ProcessorAction | undefined> {
    return { type: 'send', message: createInitMessage(this.sender) }
  }

  public async processMessage(message: Message, keyPair: KeyPair): Promise<ProcessorAction | undefined> {
    if (message.version !== 1) {
      return undefined
    }

    switch (message.type) {
      case 'challenge':
        return await this.onChallenge(message, keyPair)
      case 'accepted':
        return this.onAccepted(message)
      case 'payload':
        return this.onPayload(message)
      default:
        return undefined
    }
  }

  public async prepareMessage(recipient: Uint8Array, payload: Uint8Array): Promise<Message> {
    return createPayloadMessage(this.sender, recipient, payload)
  }

  private async onChallenge(message: ChallengeMessage, keyPair: KeyPair): Promise<ProcessorAction | undefined> {
    const nonce = new Uint8Array(16) // TODO: pow
    const payload = Buffer.concat([message.challenge, keyPair.publicKey, nonce])
    const signature = this.crypto.signP256(this.crypto.sha256(payload), keyPair.secretKey)

    return { type: 'send', message: createResponseMessage(this.sender, message.challenge, keyPair.publicKey, nonce, signature) }
  }

  private onAccepted(_message: AcceptedMessage): ProcessorAction | undefined {
    return { type: 'connected' }
  }

  private onPayload(message: PayloadMessage): ProcessorAction {
    return {
      type: 'notify',
      message: {
        sender: message.sender,
        recipient: message.recipient,
        payload: message.payload
      }
    }
  }
}