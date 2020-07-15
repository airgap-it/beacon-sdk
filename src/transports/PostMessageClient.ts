import * as sodium from 'libsodium-wrappers'
import { myWindow } from '../MockWindow'
import { ExtensionMessage, ExtensionMessageTarget, Origin, Serializer, ConnectionContext } from '..'
import { PostMessagePairingResponse } from '../types/PostMessagePairingResponse'
import { EncryptedExtensionMessage } from '../types/ExtensionMessage'
import { openCryptobox } from './../utils/crypto'
import { MessageBasedClient } from './MessageBasedClient'

export class PostMessageClient extends MessageBasedClient {
  protected readonly activeListeners: Map<
    string,
    (message: EncryptedExtensionMessage, context: ConnectionContext) => void
  > = new Map()

  public async init(): Promise<void> {
    this.subscribeToMessages().catch(console.error)
  }

  public async listenForEncryptedMessage(
    senderPublicKey: string,
    messageCallback: (message: string, context: ConnectionContext) => void
  ): Promise<void> {
    const callbackFunction = async (
      message: EncryptedExtensionMessage,
      context: ConnectionContext
    ): Promise<void> => {
      console.log('listenForEncryptedMessage callback', message)
      try {
        messageCallback(
          await this.decryptMessage(senderPublicKey, message.encryptedPayload),
          context
        )
      } catch (decryptionError) {
        /* NO-OP. We try to decode every message, but some might not be addressed to us. */
      }
    }

    this.activeListeners.set(senderPublicKey, callbackFunction)
  }

  public async sendMessage(recipientPublicKey: string, message: string): Promise<void> {
    const payload = await this.encryptMessage(recipientPublicKey, message)

    const msg: EncryptedExtensionMessage = {
      target: ExtensionMessageTarget.EXTENSION,
      encryptedPayload: payload
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

  // public async sendPairingResponse(recipientPublicKey: string): Promise<void> {
  //   await this.log('open channel')

  //   const encryptedMessage: string = await sealCryptobox(
  //     JSON.stringify(await this.getHandshakeInfo()),
  //     Buffer.from(recipientPublicKey, 'hex')
  //   )

  //   console.log('open channel encrypted message', encryptedMessage)

  //   myWindow.postMessage(encryptedMessage)
  // }

  public async isChannelOpenMessage(message: any): Promise<boolean> {
    return typeof message === 'object' && message.hasOwnProperty('payload')
  }

  private async subscribeToMessages(): Promise<void> {
    console.log('subscribing to messages')

    myWindow.addEventListener('message', (message) => {
      console.log('RAW MESSAGE', message)
      if (typeof message === 'object' && message) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: {
          message: EncryptedExtensionMessage
          sender: chrome.runtime.MessageSender
        } = (message as any).data
        if (data.message && data.message.target === ExtensionMessageTarget.PAGE) {
          this.activeListeners.forEach((listener) => {
            listener(data.message, {
              origin: Origin.EXTENSION,
              id: data.sender.id || ''
            })
          })
        }
      }
    })
  }

  // private async log(...args: unknown[]): Promise<void> {
  //   if (this.debug || true) {
  //     console.log(`--- [PostMessageCommunicationClient]:${this.name}: `, ...args)
  //   }
  // }
}
