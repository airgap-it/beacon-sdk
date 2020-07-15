// eslint-disable-next-line spaced-comment
/// <reference types="chrome"/>

import * as sodium from 'libsodium-wrappers'

import { Logger } from '../utils/Logger'
import { ConnectionContext } from '../types/ConnectionContext'
import {
  ExtensionMessage,
  ExtensionMessageTarget,
  Transport,
  TransportType,
  Origin,
  StorageKey,
  Serializer
} from '..'
import { PeerManager } from '../managers/PeerManager'
import { Storage } from '../storage/Storage'
import { PostMessagePairingRequest } from '../types/PostMessagePairingRequest'
import { TransportStatus } from '../types/transport/TransportStatus'
import { ChromeMessageClient } from './ChromeMessageClient'

const logger = new Logger('ChromeMessageTransport')

export class ChromeMessageTransport extends Transport {
  public readonly type: TransportType = TransportType.CHROME_MESSAGE

  private readonly isDapp: boolean = false
  private readonly keyPair: sodium.KeyPair

  private readonly client: ChromeMessageClient

  private readonly peerManager: PeerManager<StorageKey.TRANSPORT_POSTMESSAGE_PEERS>

  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage, isDapp: boolean) {
    super(name)
    this.keyPair = keyPair
    this.isDapp = isDapp
    this.client = new ChromeMessageClient(this.name, this.keyPair, false)
    this.peerManager = new PeerManager(storage, StorageKey.TRANSPORT_POSTMESSAGE_PEERS)
    this.init().catch((error) => console.error(error))
    this.connect().catch((error) => console.error(error))
  }

  public static async isAvailable(): Promise<boolean> {
    const isAvailable: boolean = Boolean(window.chrome && chrome.runtime && chrome.runtime.id)

    return Promise.resolve(isAvailable)
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
        // await this.connectNewPeer()
      }
    }

    await super.connect()
  }

  public async send(payload: string | Record<string, unknown>): Promise<void> {
    const message: ExtensionMessage<string | Record<string, unknown>> = {
      target: ExtensionMessageTarget.PAGE,
      payload
    }
    chrome.runtime.sendMessage(message, (data?: unknown): void => {
      logger.log('send', 'got response', data)
    })
  }

  public async sendToTabs(publicKey: string, payload: string): Promise<void> {
    return this.client.sendMessage(publicKey, payload)
  }

  public async getPeers(): Promise<PostMessagePairingRequest[]> {
    return this.peerManager.getPeers()
  }

  public async addPeer(newPeer: PostMessagePairingRequest): Promise<void> {
    if (!(await this.peerManager.hasPeer(newPeer.publicKey))) {
      logger.log('addPeer', newPeer)
      await this.peerManager.addPeer(newPeer)
      await this.listen(newPeer.publicKey) // TODO: Prevent channels from being opened multiple times
    } else {
      logger.log('addPeer', 'peer already added, skipping', newPeer)
    }
    console.log('OPENING CHANNEL')
    await this.client.openChannel(newPeer.publicKey) // TODO: Should we have a confirmation here?
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

  private async listen(publicKey: string): Promise<void> {
    console.log('listening to ', publicKey)
    await this.client
      .listenForEncryptedMessage(
        publicKey,
        async (
          message: ExtensionMessage<string>,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response?: unknown) => void
        ) => {
          const connectionContext: ConnectionContext = {
            origin: Origin.WEBSITE,
            id: sender.url ? sender.url : '',
            extras: { sender, sendResponse }
          }

          console.log('NOTIFYING LISTENERS', message)

          this.notifyListeners(message, connectionContext).catch((error) => {
            throw error
          })
        }
      )
      .catch((error) => {
        throw error
      })
  }

  private async init(): Promise<void> {
    chrome.runtime.onMessage.addListener(
      (
        message: ExtensionMessage<string>,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
      ) => {
        logger.log('init', 'receiving chrome message', message, sender)
        // const connectionContext: ConnectionContext = {
        //   origin: Origin.WEBSITE,
        //   id: sender.url ? sender.url : '',
        //   extras: { sender, sendResponse }
        // }

        if (message && message.payload && typeof message.payload === 'string') {
          console.log('TEST: popup base58 message')
          new Serializer()
            .deserialize(message.payload)
            .then((deserialized) => {
              console.log('got message that we could deserialize', deserialized)
              this.addPeer(deserialized as any).catch(console.error)
            })
            .catch(undefined)
        } else if (message && message.payload) {
          console.log('TEST: popup message')
          const connectionContext: ConnectionContext = {
            origin: Origin.WEBSITE,
            id: sender.url ? sender.url : '',
            extras: { sender, sendResponse }
          }

          this.notifyListeners(message, connectionContext).catch((error) => {
            throw error
          })
        } else {
          console.log('TEST: possibly encrypted message')
        }

        // this.notifyListeners(message, connectionContext).catch((error) => logger.error(error))
        // return true from the event listener to indicate you wish to send a response asynchronously
        // (this will keep the message channel open to the other end until sendResponse is called).

        // return true
      }
    )
  }
}
