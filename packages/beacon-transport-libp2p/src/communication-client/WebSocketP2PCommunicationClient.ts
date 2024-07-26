import { BEACON_VERSION, CommunicationClient } from '@airgap/beacon-core'
import { P2PPairingRequest, PeerInfoType } from '@airgap/beacon-types'
import { AcurastClient, KeyPair } from '@acurast/dapp'
import { forgeMessage, Message } from '@acurast/transport-websocket'
import { hexFrom } from '../utils/bytes'
import { KeyPair as KP } from '@stablelib/ed25519'
import { generateGUID } from '@airgap/beacon-utils'

export class WebSocketP2PCommunicationClient extends CommunicationClient {
  private client: AcurastClient
  private listeners: Map<string, (message: string) => void> = new Map()

  constructor(
    private name: string,
    private urls: string[],
    keyPair: KeyPair
  ) {
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

  public async getPairingRequestInfo(): Promise<P2PPairingRequest> {
    return new P2PPairingRequest(
      await generateGUID(),
      this.name,
      await this.getPublicKey(),
      BEACON_VERSION,
      this.urls[Math.floor(Math.random() * this.urls.length)]
    )
  }

  async sendMessage(message: string, peer?: PeerInfoType): Promise<void> {
    if (!peer) {
      return
    }

    this.client.send(peer.publicKey, message)
  }
}
