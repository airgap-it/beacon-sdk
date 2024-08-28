import { SDK_VERSION, CommunicationClient } from '@airgap/beacon-core'
import {
  ExtendedP2PPairingResponse,
  NodeDistributions,
  P2PPairingRequest,
  P2PPairingResponse,
  PeerInfoType,
  Regions
} from '@airgap/beacon-types'
import { AcurastClient } from '@acurast/dapp'
import { KeyPair } from '@stablelib/ed25519'
import { generateGUID } from '@airgap/beacon-utils'
import { ec } from 'elliptic'

const DEFAULT_NODES: NodeDistributions = {
  [Regions.EUROPE_WEST]: ['websocket-proxy-1.prod.gke.acurast.com'],
  [Regions.NORTH_AMERICA_EAST]: ['websocket-proxy-2.prod.gke.acurast.com']
}

export class WebSocketP2PCommunicationClient extends CommunicationClient {
  private client: AcurastClient
  private readonly channelOpeningListeners: Map<
    'channelOpening',
    (pairingResponse: ExtendedP2PPairingResponse) => void
  > = new Map()
  private listeners: Map<string, (message: any) => void> = new Map()
  private selectedNode: string
  private senderId: string = ''
  protected override keyPair: KeyPair | undefined = undefined

  constructor(
    private name: string,
    private nodes: NodeDistributions = DEFAULT_NODES
  ) {
    super()
    this.selectedNode = this.getNode()
    this.client = this.initClient([this.selectedNode])
  }

  private getSeed(): string {
    const key = Object.keys(localStorage).find((_key) => _key.includes('sdk-secret-seed'))
    if (!key) {
      throw new Error('Seed is missing.')
    }
    return localStorage.getItem(key)!
  }

  // TODO implement discovery algorithm
  private getNode(): string {
    const regions = Object.keys(this.nodes)
    const randomRegion = regions[Math.floor(Math.random() * regions.length)]
    const urls = this.nodes[randomRegion]
    const randomUrl = urls[Math.floor(Math.random() * urls.length)]
    return randomUrl
  }

  private async initKeyPair() {
    const ecdsa = new ec('p256') // Using the P-256 curve

    // Generate key pair from seed
    const seedBuffer = Buffer.from(this.getSeed(), 'utf-8')

    // Use Web Crypto API to create a SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', seedBuffer)
    const privateKeyHex = Buffer.from(hashBuffer).toString('hex')

    const keyPair = ecdsa.keyFromPrivate(privateKeyHex)

    const privateKeyRaw = Buffer.from(keyPair.getPrivate().toString('hex'), 'hex')
    const publicKeyRaw = Buffer.from(keyPair.getPublic().encode('array', false))

    const publicKeyCompressedSize = (publicKeyRaw.length - 1) / 2
    const publicKeyCompressed = Buffer.concat([
      new Uint8Array([publicKeyRaw[2 * publicKeyCompressedSize] % 2 ? 3 : 2]),
      publicKeyRaw.subarray(1, publicKeyCompressedSize + 1)
    ])

    const publicKeyHash = await crypto.subtle.digest('SHA-256', publicKeyCompressed)
    const senderId = Buffer.from(publicKeyHash.slice(0, 16)).toString('hex')

    return {
      publicKey: publicKeyRaw,
      secretKey: privateKeyRaw,
      senderId
    }
  }

  private initClient(urls: string[]): AcurastClient {
    const client = new AcurastClient(urls.map((url) => `wss://${url}`))
    client.onMessage(async (message) => {
      let parsed: any = Buffer.from(message.payload).toString('utf-8')
      try {
        parsed = JSON.parse(parsed)
      } catch {}

      if (this.channelOpeningListeners.size) {
        this.channelOpeningListeners.get('channelOpening')!(parsed)
        this.channelOpeningListeners.delete('channelOpening')
      } else {
        this.listeners.forEach((fun) => fun(parsed))
      }
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

  async connect() {
    const { publicKey, secretKey, senderId } = await this.initKeyPair()
    this.keyPair = {
      publicKey,
      secretKey
    }
    this.senderId = senderId
    await this.client.start(this.keyPair)
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
      SDK_VERSION,
      this.selectedNode
    )
  }

  public async getPairingResponseInfo(request: P2PPairingRequest): Promise<P2PPairingResponse> {
    return new P2PPairingResponse(request.id, this.name, this.senderId, '4', this.selectedNode)
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