import { CommunicationClient } from '@airgap/beacon-core'
import { PeerInfoType } from '@airgap/beacon-types'
import { AcurastClient } from '@acurast/dapp'

const DEFAULT_NODES = [
  'wss://websocket-proxy-1.prod.gke.acurast.com/',
  'wss://websocket-proxy-2.prod.gke.acurast.com/'
]

export class WebSocketP2PClient extends CommunicationClient {
  private client: AcurastClient

  constructor(urls: string[] = DEFAULT_NODES) {
    super()
    this.client = new AcurastClient(urls)
  }

  unsubscribeFromEncryptedMessages(): Promise<void> {
    return this.client.close()
  }

  /**
   * DO NOT USE!
   * @param senderPublicKey
   */
  async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    console.log(senderPublicKey)
  }

  async sendMessage(message: string, peer?: PeerInfoType): Promise<void> {
    if (!peer) {
      return
    }

    this.client.send(this.client.idFromPublicKey(peer.publicKey), message)
  }
}
