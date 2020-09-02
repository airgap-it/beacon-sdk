import { ExtensionMessage, ExtensionMessageTarget } from '../..'
import { EncryptedExtensionMessage } from '../../types/ExtensionMessage'
import { sealCryptobox } from '../../utils/crypto'
import { MessageBasedClient } from './MessageBasedClient'

export class ChromeMessageClient extends MessageBasedClient {
  protected readonly activeListeners: Map<
    string,
    (
      message: ExtensionMessage<string> | EncryptedExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => void
  > = new Map()

  public async init(): Promise<void> {
    this.subscribeToMessages().catch(console.error)
  }

  public async listenForEncryptedMessage(
    senderPublicKey: string,
    messageCallback: (
      message: ExtensionMessage<string>,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => void
  ): Promise<void> {
    if (this.activeListeners.has(senderPublicKey)) {
      return
    }

    const callbackFunction = async (
      message: ExtensionMessage<string> | EncryptedExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ): Promise<void> => {
      if (message.hasOwnProperty('encryptedPayload')) {
        const encryptedMessage: EncryptedExtensionMessage = message as EncryptedExtensionMessage

        try {
          const decrypted = await this.decryptMessage(
            senderPublicKey,
            encryptedMessage.encryptedPayload
          )
          const decryptedMessage: ExtensionMessage<string> = {
            payload: decrypted,
            target: encryptedMessage.target,
            sender: encryptedMessage.sender
          }
          messageCallback(decryptedMessage, sender, sendResponse)
        } catch (decryptionError) {
          /* NO-OP. We try to decode every message, but some might not be addressed to us. */
        }
      }
    }

    this.activeListeners.set(senderPublicKey, callbackFunction)
  }

  public async sendMessage(recipientPublicKey: string, message: string): Promise<void> {
    const payload = await this.encryptMessage(recipientPublicKey, message)

    const msg: EncryptedExtensionMessage = {
      target: ExtensionMessageTarget.PAGE,
      encryptedPayload: payload
    }

    chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
      // TODO: Find way to have direct communication with tab
      tabs.forEach(({ id }: chrome.tabs.Tab) => {
        if (id) {
          chrome.tabs.sendMessage(id, msg)
        }
      }) // Send message to all tabs
    })
  }

  public async sendPairingResponse(recipientPublicKey: string): Promise<void> {
    const encryptedMessage: string = await sealCryptobox(
      JSON.stringify(await this.getHandshakeInfo()),
      Buffer.from(recipientPublicKey, 'hex')
    )

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

  private async subscribeToMessages(): Promise<void> {
    chrome.runtime.onMessage.addListener(
      (
        message: ExtensionMessage<string> | EncryptedExtensionMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
      ) => {
        this.activeListeners.forEach((listener) => {
          listener(message, sender, sendResponse)
        })

        // return true from the event listener to indicate you wish to send a response asynchronously
        // (this will keep the message channel open to the other end until sendResponse is called).
        return true
      }
    )
  }
}
