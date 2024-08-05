import { BEACON_VERSION, CommunicationClient } from '@airgap/beacon-core'
import {
  ExtendedP2PPairingResponse,
  P2PPairingRequest,
  P2PPairingResponse,
  PeerInfoType
} from '@airgap/beacon-types'
import { AcurastClient } from '@acurast/dapp'
import { forgeMessage, Message } from '@acurast/transport-websocket'
import { hexFrom } from '../utils/bytes'
import { KeyPair } from '@stablelib/ed25519'
import { generateGUID } from '@airgap/beacon-utils'

export class WebSocketP2PCommunicationClient extends CommunicationClient {
  private client: AcurastClient
  private readonly channelOpeningListeners: Map<
    string,
    (pairingResponse: ExtendedP2PPairingResponse) => void
  > = new Map()
  private listeners: Map<string, (message: string) => void> = new Map()

  constructor(
    private name: string,
    private urls: string[],
    keyPair: KeyPair
  ) {
    super(keyPair)
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
    this.channelOpeningListeners.clear()
  }

  /**
   * Unsubscribe from the specified listener
   * @param senderPublicKey
   */
  async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    this.listeners.delete(this.client.idFromPublicKey(senderPublicKey))
    this.channelOpeningListeners.delete('channelOpening')
  }

  connect() {
    return this.client.start(this.keyPair!)
  }

  close() {
    return this.client.close()
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: ExtendedP2PPairingResponse) => void
  ): Promise<void> {
    const callbackFunction = async (pairingResponse: ExtendedP2PPairingResponse): Promise<void> => {
      messageCallback(pairingResponse)
    }
    this.channelOpeningListeners.set('channelOpening', callbackFunction)
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

  public async getPairingResponseInfo(request: P2PPairingRequest): Promise<P2PPairingResponse> {
    const info: P2PPairingResponse = new P2PPairingResponse(
      request.id,
      this.name,
      await this.getPublicKey(),
      request.version,
      request.relayServer
    )

    return info
  }

  public async sendPairingResponse(pairingRequest: P2PPairingRequest): Promise<void> {
    // TODO add encryption
    const message = JSON.stringify(await this.getPairingResponseInfo(pairingRequest))
    const msg = [
      '@channel-open',
      this.client.idFromPublicKey(pairingRequest.publicKey),
      message
    ].join(':')

    this.sendMessage(msg, { publicKey: pairingRequest.publicKey } as any)
  }

  async sendMessage(message: string, { publicKey }: PeerInfoType): Promise<void> {
    this.client.send(this.client.idFromPublicKey(publicKey), message)
  }
}
