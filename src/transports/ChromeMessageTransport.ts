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
import { ExtendedPostMessagePairingResponse } from '../types/PostMessagePairingResponse'
import { ChromeMessageClient } from './clients/ChromeMessageClient'

const logger = new Logger('ChromeMessageTransport')

export class ChromeMessageTransport<
  T extends PostMessagePairingRequest | ExtendedPostMessagePairingResponse,
  K extends
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET
> extends Transport<T, K, ChromeMessageClient> {
  public readonly type: TransportType = TransportType.CHROME_MESSAGE

  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage, storageKey: K) {
    super(name, new ChromeMessageClient(name, keyPair, false), new PeerManager(storage, storageKey))
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

    const knownPeers = await this.getPeers()

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async (peer) => this.listen(peer.publicKey))
      await Promise.all(connectionPromises)
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

  public async sendToTabs(publicKey: string | undefined, payload: string): Promise<void> {
    const peers = await this.getPeers()
    const peer = peers.find((peerEl) => peerEl.publicKey === publicKey)
    if (peer) {
      return this.client.sendMessage(peer, payload)
    }
  }

  public async addPeer(newPeer: T): Promise<void> {
    await super.addPeer(newPeer)
    // await this.client.sendPairingResponse(newPeer) // TODO: Should we have a confirmation here?
  }

  public async listen(publicKey: string): Promise<void> {
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

        if (message && message.payload && typeof message.payload === 'string') {
          // Handling PairingRequest and connect peer
          new Serializer()
            .deserialize(message.payload)
            .then((deserialized) => {
              // TODO: Add check if it's a peer
              if ((deserialized as any).publicKey) {
                this.addPeer(deserialized as any).catch(console.error)
              } else {
                // V1 does not support encryption, so we handle the message directly
                if ((deserialized as any).version === '1') {
                  this.notify(message, sender, sendResponse).catch((error) => {
                    throw error
                  })
                }
              }
            })
            .catch(undefined)
        } else if (message && message.payload) {
          // Most likely an internal, unencrypted message
          this.notify(message, sender, sendResponse).catch((error) => {
            throw error
          })
        }

        // return true from the event listener to indicate you wish to send a response asynchronously
        // (this will keep the message channel open to the other end until sendResponse is called).

        // return true
      }
    )
  }

  private async notify(
    message: ExtensionMessage<string>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): Promise<void> {
    const connectionContext: ConnectionContext = {
      origin: Origin.WEBSITE,
      id: sender.url ? sender.url : '',
      extras: { sender, sendResponse }
    }

    this.notifyListeners(message, connectionContext).catch((error) => {
      throw error
    })
  }
}
