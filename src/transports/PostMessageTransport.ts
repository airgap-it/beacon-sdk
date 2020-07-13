import * as sodium from 'libsodium-wrappers'
import { myWindow } from '../MockWindow'
import {
  ExtensionMessage,
  ExtensionMessageTarget,
  TransportType,
  TransportStatus,
  P2PPairInfo,
  ConnectionContext
} from '..'
import { Origin } from '../types/Origin'
import { PeerManager } from '../managers/PeerManager'
import { Logger } from '../utils/Logger'
import { Storage } from '../storage/Storage'
import { PostMessagePairingResponse } from '../types/PostMessagePairingResponse'
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

  private readonly peerManager: PeerManager

  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage, isDapp: boolean) {
    super(name)
    this.keyPair = keyPair
    this.isDapp = isDapp
    this.client = new PostMessageClient(this.name, this.keyPair, false)
    this.peerManager = new PeerManager(storage)
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
            logger.log('connectNewPeer', `new publicKey ${pairingResponse}`)

            if (!(await this.peerManager.hasPeer(pairingResponse.publicKey))) {
              await this.peerManager.addPeer(pairingResponse as any) // TODO: Type
              await this.client.listenForEncryptedMessage(pairingResponse.publicKey, (message) => {
                console.log('decrypted message', message)
              })
            }

            resolve()
          }
        )
        this.listeningForChannelOpenings = true
      }
    })
  }

  public async getPeers(): Promise<P2PPairInfo[]> {
    return this.peerManager.getPeers()
  }

  public async addPeer(newPeer: P2PPairInfo): Promise<void> {
    if (!(await this.peerManager.hasPeer(newPeer.publicKey))) {
      logger.log('addPeer', newPeer)
      await this.peerManager.addPeer({
        name: newPeer.name,
        publicKey: newPeer.publicKey,
        relayServer: newPeer.relayServer
      })

      await this.client.openChannel(newPeer.publicKey) // TODO: Should we have a confirmation here?
      await this.listen(newPeer.publicKey) // TODO: Prevent channels from being opened multiple times
    } else {
      logger.log('addPeer', 'peer already added, skipping', newPeer)
    }
  }

  public async removePeer(peerToBeRemoved: P2PPairInfo): Promise<void> {
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
    if (recipient) {
      console.log('SENDING ENCRYPTED', recipient, message)
      await this.client.sendMessage(recipient, message)
    } else {
      console.log('SENDING UNENCRYPTED', message)
      const data: ExtensionMessage<string> = {
        target: ExtensionMessageTarget.EXTENSION,
        payload: message
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      myWindow.postMessage(data as any, '*')
    }
  }

  private async listen(publicKey: string): Promise<void> {
    console.log('listening to ', publicKey)
    await this.client
      .listenForEncryptedMessage(publicKey, (message) => {
        const connectionContext: ConnectionContext = {
          origin: Origin.EXTENSION,
          id: publicKey // TODO: Chrome ExtensionId and senderId
        }

        console.log('NOTIFYING LISTENERS')

        this.notifyListeners(message, connectionContext).catch((error) => {
          throw error
        })
      })
      .catch((error) => {
        throw error
      })
  }
}
