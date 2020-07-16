import * as sodium from 'libsodium-wrappers'
import { myWindow } from '../MockWindow'
import {
  ExtensionMessage,
  ExtensionMessageTarget,
  TransportType,
  TransportStatus,
  ConnectionContext,
  StorageKey
} from '..'
import { Origin } from '../types/Origin'
import { PeerManager } from '../managers/PeerManager'
import { Logger } from '../utils/Logger'
import { Storage } from '../storage/Storage'
import { PostMessagePairingResponse } from '../types/PostMessagePairingResponse'
import { PostMessagePairingRequest } from '../types/PostMessagePairingRequest'
import { Transport } from './Transport'
import { PostMessageClient } from './PostMessageClient'

const logger = new Logger('PostMessageTransport')

export class PostMessageTransport extends Transport {
  public readonly type: TransportType = TransportType.POST_MESSAGE

  private readonly isDapp: boolean = true
  private readonly keyPair: sodium.KeyPair

  private readonly client: PostMessageClient

  // Make sure we only listen once
  private listeningForChannelOpenings: boolean = false

  private readonly peerManager: PeerManager<StorageKey.TRANSPORT_POSTMESSAGE_PEERS>

  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage, isDapp: boolean) {
    super(name)
    this.keyPair = keyPair
    this.isDapp = isDapp
    this.client = new PostMessageClient(this.name, this.keyPair, false)
    this.peerManager = new PeerManager(storage, StorageKey.TRANSPORT_POSTMESSAGE_PEERS)
  }

  public static async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fn = (event: any): void => {
        const data = event.data as ExtensionMessage<string>
        if (data && data.payload === 'pong') {
          resolve(true)
          myWindow.removeEventListener('message', fn)
        }
      }

      myWindow.addEventListener('message', fn)

      const message: ExtensionMessage<string> = {
        target: ExtensionMessageTarget.EXTENSION,
        payload: 'ping'
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      myWindow.postMessage(message as any, '*')
    })
  }

  public async connect(): Promise<void> {
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTING

    const knownPeers = await this.peerManager.getPeers()

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async (peer) => this.listen(peer.publicKey))
      await Promise.all(connectionPromises)
    } else {
      if (this.isDapp) {
        await this.connectNewPeer()
      }
    }

    await super.connect()
  }

  public async reconnect(): Promise<void> {
    if (this.isDapp) {
      await this.connectNewPeer()
    }
  }

  public async connectNewPeer(): Promise<void> {
    logger.log('connectNewPeer')

    return new Promise(async (resolve) => {
      if (!this.listeningForChannelOpenings) {
        await this.client.listenForChannelOpening(
          async (pairingResponse: PostMessagePairingResponse) => {
            logger.log('connectNewPeer', `received PairingResponse`, pairingResponse)

            await this.addPeer(pairingResponse)

            resolve()
          }
        )
        this.listeningForChannelOpenings = true
      }
    })
  }

  public async getPeers(): Promise<PostMessagePairingRequest[]> {
    return this.peerManager.getPeers()
  }

  public async addPeer(newPeer: PostMessagePairingRequest): Promise<void> {
    if (!(await this.peerManager.hasPeer(newPeer.publicKey))) {
      logger.log('addPeer', newPeer)
      await this.peerManager.addPeer(newPeer)
      await this.listen(newPeer.publicKey)
    } else {
      logger.log('addPeer', 'peer already added, skipping', newPeer)
    }
  }

  public async removePeer(peerToBeRemoved: PostMessagePairingRequest): Promise<void> {
    logger.log('removePeer', peerToBeRemoved)
    await this.peerManager.removePeer(peerToBeRemoved.publicKey)
    if (this.client) {
      await this.client.unsubscribeFromEncryptedMessage(peerToBeRemoved.publicKey)
    }
  }

  public async removeAllPeers(): Promise<void> {
    logger.log('removeAllPeers')
    await this.peerManager.removeAllPeers()

    await this.client.unsubscribeFromEncryptedMessages()
  }

  public async send(message: string, recipient?: string): Promise<void> {
    logger.log('send', recipient, message)

    if (recipient) {
      await this.client.sendMessage(recipient, message)
    } else {
      const peers = await this.peerManager.getPeers()
      peers.forEach((peer) => {
        this.client.sendMessage(peer.publicKey, message).catch(console.error)
      })
    }
  }

  private async listen(publicKey: string): Promise<void> {
    logger.log('listen', publicKey)

    await this.client
      .listenForEncryptedMessage(publicKey, (message: string, context: ConnectionContext) => {
        const connectionContext: ConnectionContext = {
          origin: Origin.EXTENSION,
          id: context.id
        }

        this.notifyListeners(message, connectionContext).catch((error) => {
          throw error
        })
      })
      .catch((error) => {
        throw error
      })
  }
}
