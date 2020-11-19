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
import { Extension } from '../utils/available-transports'
import { ExposedPromise } from '../utils/exposed-promise'
import { Transport } from './Transport'
import { PostMessageClient } from './clients/PostMessageClient'

const logger = new Logger('PostMessageTransport')

let extensions: ExposedPromise<Extension[]> | undefined

export class PostMessageTransport extends Transport<PostMessagePairingResponse> {
  public readonly type: TransportType = TransportType.POST_MESSAGE

  /**
   * The client handling the encryption/decryption of messages
   */
  private readonly client: PostMessageClient

  private readonly peerManager: PeerManager<StorageKey.TRANSPORT_POSTMESSAGE_PEERS>

  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage) {
    super(name)
    this.client = new PostMessageClient(this.name, keyPair, false)
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
      myWindow.postMessage(message as any, window.location.origin)
    })
  }

  public static async getAvailableExtensions(): Promise<Extension[]> {
    if (extensions) {
      return extensions.promise
    }

    extensions = new ExposedPromise()
    const localExtensions: Extension[] = []

    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fn = (event: any): void => {
        const data = event.data as ExtensionMessage<
          string,
          { id: string; name: string; iconURL: string }
        >
        const sender = data.sender
        if (data && data.payload === 'pong' && sender) {
          if (!localExtensions.some((ext) => ext.id === sender.id)) {
            localExtensions.push(sender)
          }
        }
      }

      myWindow.addEventListener('message', fn)

      setTimeout(() => {
        myWindow.removeEventListener('message', fn)
        if (extensions) {
          extensions.resolve(localExtensions)
        }
        resolve(localExtensions)
      }, 1000)

      const message: ExtensionMessage<string> = {
        target: ExtensionMessageTarget.EXTENSION,
        payload: 'ping'
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      myWindow.postMessage(message as any, window.location.origin)
    })
  }

  public async connect(): Promise<void> {
    logger.log('connect')
    if (this._isConnected !== TransportStatus.NOT_CONNECTED) {
      return
    }

    this._isConnected = TransportStatus.CONNECTING

    const knownPeers = await this.peerManager.getPeers()

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async (peer) => this.listen(peer.publicKey))

      Promise.all(connectionPromises).catch(console.log)
    }

    await this.client.listenForChannelOpening(async (peer: PostMessagePairingResponse) => {
      logger.log('connect', `received PostMessagePairingResponse`, peer)

      await this.addPeer(peer as any)

      this._isConnected = TransportStatus.CONNECTED

      if (this.newPeerListener) {
        this.newPeerListener(peer as any)
        this.newPeerListener = undefined // TODO: Remove this once we use the id
      }
    })

    await super.connect()
  }

  public async getPairingRequestInfo(): Promise<PostMessagePairingRequest> {
    return this.client.getPairingRequestInfo()
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
    await this.client.unsubscribeFromEncryptedMessage(peerToBeRemoved.publicKey)
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
      await Promise.all(
        peers.map((peer) => this.client.sendMessage(peer.publicKey, message).catch(console.error))
      )
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
