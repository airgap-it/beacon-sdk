import { type Message } from '../message/messages'
import { Crypto } from '../crypto'
import { type WebSocketSession } from '../websocket'

import { type KeyPair, type MessageListener } from './types'
import {
  type ProcessorAction,
  type MessageProcessor,
  type NotifyProcessorAction,
  type SendProcessorAction,
  type ConnectedProcessorAction
} from './processor/message-processor'
import { V1MessageProcessor } from './processor/v1-message.processor'
import { Deferred } from '../utils/deferred'
import { log } from '../utils/log'
import { timeoutPromise } from '../utils/promise'

export abstract class WebSocketTransportClient {
  private readonly version = 1 // Somehow get the highest supported version of the counterparty?
  private readonly isConnected: Deferred = new Deferred()

  private messageProcessors: Record<number, MessageProcessor> = {}
  private messageListeners: MessageListener[] = []

  protected constructor(
    private readonly url: string,
    private readonly connectionTimeoutMillis: number,
    private readonly session: WebSocketSession,
    private readonly crypto: Crypto = new Crypto()
  ) {}

  public async connect(keyPair: KeyPair): Promise<void> {
    await this.session.open(this.url)

    this.log('Session opened')

    const normalizedKeyPair: KeyPair = {
      secretKey: keyPair.secretKey,
      publicKey: this.crypto.compressP256PublicKey(keyPair.publicKey)
    }

    const sender = this.senderId(normalizedKeyPair.publicKey)

    this.messageProcessors = {
      1: new V1MessageProcessor(sender, this.crypto)
    }

    this.session.onMessage(async (message: Message) => {
      this.log('Got message', message)
      const processor: MessageProcessor | undefined = this.messageProcessors[message.version]
      if (processor === undefined) {
        return
      }

      const action: ProcessorAction | undefined = await processor.processMessage(
        message,
        normalizedKeyPair
      )
      await this.onAction(action)
    })

    const processor: MessageProcessor | undefined = this.messageProcessors[this.version]
    if (processor === undefined) {
      return
    }

    const action: ProcessorAction | undefined = await processor.init()
    await this.onAction(action)

    await timeoutPromise(this.connectionTimeoutMillis, this.isConnected.promise).catch(() => {
      throw new Error(`The connection with ${this.url} could not be established.`)
    })

    this.log('Connected')
  }

  public async send(publicKeyOrSenderId: Uint8Array, payload: Uint8Array): Promise<void> {
    const processor: MessageProcessor | undefined = this.messageProcessors[this.version]
    if (processor === undefined) {
      return
    }

    const recipient: Uint8Array = this.senderId(publicKeyOrSenderId)
    const message: Message = await processor.prepareMessage(recipient, payload)

    console.log('ACURAST_SEND', message)

    await this.session.send(message)

    this.log('Sent payload', 'Sent', payload, 'to', publicKeyOrSenderId)
    this.log(
      'Sent payload 1',
      'Sent',
      Buffer.from(payload).toString(),
      'to',
      Buffer.from(publicKeyOrSenderId).toString()
    )
  }

  public onMessage(listener: MessageListener): void {
    this.messageListeners.push(listener)
  }

  public async close(): Promise<void> {
    this.messageListeners = []
    await this.session.close()
  }

  private async onAction(action: ProcessorAction | undefined): Promise<void> {
    switch (action?.type) {
      case 'connected':
        this.onConnected(action)
        break
      case 'send':
        await this.onSend(action)
        break
      case 'notify':
        this.onNotify(action)
        break
    }
  }

  private onConnected(_action: ConnectedProcessorAction): void {
    this.isConnected.resolve()
  }

  private async onSend(action: SendProcessorAction): Promise<void> {
    await this.session.send(action.message)
  }

  private onNotify(action: NotifyProcessorAction): void {
    this.messageListeners.forEach((listener: MessageListener) => {
      void listener(action.message)
    })
  }

  private senderId(publicKeyOrSenderId: Uint8Array): Uint8Array {
    if (publicKeyOrSenderId.length === 16) {
      return publicKeyOrSenderId
    }
    const pkh = this.crypto.sha256(publicKeyOrSenderId)
    return pkh.slice(0, 16)
  }

  private log(event: string, ...data: any[]): void {
    log(`[ACURAST-TRANSPORT-WEBSOCKET:${this.url}] ${event}`, ...data)
  }
}
