import { BEACON_VERSION, CommunicationClient } from '@airgap/beacon-core'
import {
  ExtendedP2PPairingResponse,
  P2PPairingRequest,
  P2PPairingResponse,
  PeerInfoType
} from '@airgap/beacon-types'
import { AcurastClient } from '@acurast/dapp'
import { hexFrom } from '../utils/bytes'
import { KeyPair } from '@stablelib/ed25519'
import { generateGUID } from '@airgap/beacon-utils'

export class WebSocketP2PCommunicationClient extends CommunicationClient {
  private client: AcurastClient
  private readonly channelOpeningListeners: Map<
    string,
    (pairingResponse: ExtendedP2PPairingResponse) => void
  > = new Map()
  private listeners: Map<string, (message: any) => void> = new Map()
  private selectedNode: string

  constructor(
    private name: string,
    private urls: string[],
    keyPair: KeyPair,
    private senderId: string
  ) {
    super(keyPair)
    this.selectedNode = this.urls[Math.floor(Math.random() * this.urls.length)]
    this.client = this.initClient([this.selectedNode])
  }

  private initClient(urls: string[]): AcurastClient {
    const client = new AcurastClient(urls)
    client.onMessage((message) => {
      const fun = this.listeners.get(hexFrom(message.recipient))
      fun && fun(JSON.parse(Buffer.from(message.payload).toString('utf-8')))
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
  async unsubscribeFromEncryptedMessage(senderId: string): Promise<void> {
    this.listeners.delete(senderId)
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

  async listenForEncryptedMessage(senderId: string, messageCallback: (message: any) => void) {
    this.listeners.set(senderId, messageCallback)
  }

  public async getPairingRequestInfo(): Promise<P2PPairingRequest> {
    return new P2PPairingRequest(
      await generateGUID(),
      this.name,
      this.senderId,
      BEACON_VERSION,
      this.selectedNode
    )
  }

  public async getPairingResponseInfo(request: P2PPairingRequest): Promise<P2PPairingResponse> {
    return new P2PPairingResponse(
      request.id,
      this.name,
      this.senderId,
      request.version,
      this.selectedNode
    )
  }

  public async sendPairingResponse(pairingRequest: P2PPairingRequest): Promise<void> {
    this.sendRequest(
      pairingRequest.publicKey,
      JSON.stringify(await this.getPairingResponseInfo(pairingRequest))
    )
  }

  async sendRequest(senderId: string, message: string) {
    this.client.send(senderId, message)
  }

  /**
   * @deprecated The method should not be used. Use `sendRequest` instead.
   */
  async sendMessage(message: string, { publicKey }: PeerInfoType): Promise<void> {
    this.client.send(this.client.idFromPublicKey(publicKey), message)
  }
}
