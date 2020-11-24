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
import { ExtendedPostMessagePairingResponse } from '../types/PostMessagePairingResponse'
import { PostMessagePairingRequest } from '../types/PostMessagePairingRequest'
import { Extension } from '../utils/available-transports'
import { ExposedPromise } from '../utils/exposed-promise'
import { Transport } from './Transport'
import { PostMessageClient } from './clients/PostMessageClient'

const logger = new Logger('PostMessageTransport')

let extensions: ExposedPromise<Extension[]> | undefined

export class PostMessageTransport<
  T extends PostMessagePairingRequest | ExtendedPostMessagePairingResponse,
  K extends
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET
> extends Transport<T, K, PostMessageClient> {
  public readonly type: TransportType = TransportType.POST_MESSAGE

  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage, storageKey: K) {
    super(
      name,
      new PostMessageClient(name, keyPair, false),
      new PeerManager<K>(storage, storageKey)
    )
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

    const knownPeers = await this.getPeers()

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async (peer) => this.listen(peer.publicKey))

      Promise.all(connectionPromises).catch(console.log)
    }

    await this.startOpenChannelListener()

    await super.connect()
  }

  public async startOpenChannelListener(): Promise<void> {
    //
  }

  public async getPairingRequestInfo(): Promise<PostMessagePairingRequest> {
    return this.client.getPairingRequestInfo()
  }

  public async listen(publicKey: string): Promise<void> {
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
