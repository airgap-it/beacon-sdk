import { CommunicationClient } from '@airgap/beacon-core'
import { PeerInfoType } from '@airgap/beacon-types'
import { AcurastClient, KeyPair } from '@acurast/dapp'
import { forgeMessage, Message } from '@acurast/transport-websocket'
import { hexFrom } from '../utils/bytes'
import { KeyPair as KP } from '@stablelib/ed25519'

export class WebSocketP2PCommunicationClient extends CommunicationClient {
  private client: AcurastClient
  private listeners: Map<string, (message: string) => void> = new Map()

  constructor(urls: string[], keyPair: KeyPair) {
    super(keyPair as unknown as KP)
    this.client = this.initClient(urls)
  }

  private initClient(urls: string[]): AcurastClient {
    const client = new AcurastClient(urls)
    client.onMessage((message) => {
      const fun = this.listeners.get(hexFrom(message.recipient))
      fun && fun(hexFrom(forgeMessage(message as Message)))
    })

    return client
  }

  async unsubscribeFromEncryptedMessages(): Promise<void> {
    this.listeners.clear()
  }

  /**
   * Unsubscribe from the specified listener
   * @param senderPublicKey
   */
  async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    this.listeners.delete(this.client.idFromPublicKey(senderPublicKey))
  }

  connect() {
    return this.client.start(this.keyPair!)
  }

  close() {
    return this.client.close()
  }

  async listenForEncryptedMessage(
    senderPublicKey: string,
    messageCallback: (message: string) => void
  ) {
    this.listeners.set(this.client.idFromPublicKey(senderPublicKey), messageCallback)
  }

  async sendMessage(message: string, peer?: PeerInfoType): Promise<void> {
    if (!peer) {
      return
    }

    this.client.send(peer.publicKey, message)
  }
}
