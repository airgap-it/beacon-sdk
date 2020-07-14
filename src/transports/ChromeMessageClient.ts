import * as sodium from 'libsodium-wrappers'
import { myWindow } from '../MockWindow'
import { ExtensionMessage, ExtensionMessageTarget, Serializer } from '..'
import { PostMessagePairingResponse } from '../types/PostMessagePairingResponse'
import { PostMessagePairingRequest } from '../types/PostMessagePairingRequest'
import { EncryptedExtensionMessage } from '../types/ExtensionMessage'
import {
  decryptCryptoboxPayload,
  sealCryptobox,
  openCryptobox,
  encryptCryptoboxPayload
} from './../utils/crypto'
import { CommunicationClient } from './CommunicationClient'

export class ChromeMessageClient extends CommunicationClient {
  private readonly activeListeners: Map<
    string,
    (
      message: ExtensionMessage<string> | EncryptedExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => void
  > = new Map()

  constructor(
    private readonly name: string,
    keyPair: sodium.KeyPair,
    private readonly debug: boolean = true
  ) {
    super(keyPair)
  }

  public async start(): Promise<void> {
    await sodium.ready
  }

  public async getHandshakeInfo(): Promise<PostMessagePairingRequest> {
    return {
      name: this.name,
      publicKey: await this.getPublicKey()
    }
  }

  public async listenForEncryptedMessage(
    senderPublicKey: string,
    messageCallback: (
      message: ExtensionMessage<string>,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => void
  ): Promise<void> {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }

    const { sharedRx } = await this.createCryptoBoxServer(senderPublicKey, this.keyPair.privateKey)

    const callbackFunction = async (
      message: ExtensionMessage<string> | EncryptedExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ): Promise<void> => {
      if (message.hasOwnProperty('encryptedPayload')) {
        const msg: EncryptedExtensionMessage = message as EncryptedExtensionMessage
        console.log('listenForEncryptedMessage callback', msg)
        const payload = Buffer.from(msg.encryptedPayload, 'hex')
        if (
          payload.length >=
          sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES
        ) {
          try {
            const decrypted = await decryptCryptoboxPayload(payload, sharedRx)
            const pld: ExtensionMessage<string> = {
              payload: decrypted,
              target: msg.target,
              sender: msg.sender
            }
            messageCallback(pld, sender, sendResponse)
          } catch (decryptionError) {
            console.log('PostMessage decryption failed!', message)
            /* NO-OP. We try to decode every message, but some might not be addressed to us. */
          }
        }
      } else {
        const msg: ExtensionMessage<string> = message as ExtensionMessage<string>
        messageCallback(msg, sender, sendResponse)

        return
      }
    }

    this.activeListeners.set(senderPublicKey, callbackFunction)

    await this.subscribeToRawMessage(callbackFunction)
  }

  public async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    const listener = this.activeListeners.get(senderPublicKey)
    if (!listener) {
      return
    }

    this.activeListeners.delete(senderPublicKey)
  }

  public async unsubscribeFromEncryptedMessages(): Promise<void> {
    this.activeListeners.clear()
  }

  public async sendMessage(recipientPublicKey: string, message: string): Promise<void> {
    if (!this.keyPair) {
      throw new Error('KeyPair not available')
    }
    const { sharedTx } = await this.createCryptoBoxClient(
      recipientPublicKey,
      this.keyPair.privateKey
    )

    const payload = await encryptCryptoboxPayload(message, sharedTx)

    const msg: ExtensionMessage<string> = {
      target: ExtensionMessageTarget.EXTENSION,
      payload
    }

    myWindow.postMessage(msg as any, '*')
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: PostMessagePairingResponse) => void
  ): Promise<void> {
    console.log('listenForChannelOpening')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = async (event: any): Promise<void> => {
      console.log('GOT A MESSAGE', event)
      const data = event?.data?.message as ExtensionMessage<string>
      if (
        data &&
        data.target === ExtensionMessageTarget.PAGE &&
        (await this.isChannelOpenMessage(data))
      ) {
        console.log('is channel open message')

        const payload = Buffer.from(data.payload, 'hex')
        console.log('payload', payload)

        if (
          payload.length >=
          sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES
        ) {
          try {
            const decrypted = await openCryptobox(
              payload,
              this.keyPair.publicKey,
              this.keyPair.privateKey
            )

            console.log(decrypted)

            messageCallback(JSON.parse(decrypted))

            myWindow.removeEventListener('message', fn)
          } catch (decryptionError) {
            console.log('decryption failed', decryptionError)
            /* NO-OP. We try to decode every message, but some might not be addressed to us. */
          }
        }
      }
    }

    myWindow.addEventListener('message', fn)

    const message: ExtensionMessage<string> = {
      target: ExtensionMessageTarget.EXTENSION,
      payload: await new Serializer().serialize(await this.getHandshakeInfo())
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    myWindow.postMessage(message as any, '*')
  }

  public async openChannel(recipientPublicKey: string): Promise<void> {
    await this.log('open channel')

    const encryptedMessage: string = await sealCryptobox(
      JSON.stringify(await this.getHandshakeInfo()),
      Buffer.from(recipientPublicKey, 'hex')
    )

    console.log('open channel encrypted message', encryptedMessage)

    myWindow.postMessage(encryptedMessage)
    const message: ExtensionMessage<string> = {
      target: ExtensionMessageTarget.PAGE,
      payload: encryptedMessage
    }
    chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
      // TODO: Find way to have direct communication with tab
      tabs.forEach(({ id }: chrome.tabs.Tab) => {
        if (id) {
          chrome.tabs.sendMessage(id, message)
        }
      }) // Send message to all tabs
    })
  }

  public async isChannelOpenMessage(message: any): Promise<boolean> {
    return typeof message === 'object' && message.hasOwnProperty('payload')
  }

  private async subscribeToRawMessage(
    callback: (
      message: ExtensionMessage<string> | EncryptedExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => void
  ): Promise<void> {
    console.log('subscribing to messages')

    chrome.runtime.onMessage.addListener(
      (
        message: ExtensionMessage<string> | EncryptedExtensionMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
      ) => {
        console.log('listen', 'receiving chrome message', message)

        callback(message, sender, sendResponse)

        // return true from the event listener to indicate you wish to send a response asynchronously
        // (this will keep the message channel open to the other end until sendResponse is called).
        return true
      }
    )
  }

  private async log(...args: unknown[]): Promise<void> {
    if (this.debug || true) {
      console.log(`--- [PostMessageCommunicationClient]:${this.name}: `, ...args)
    }
  }
}
