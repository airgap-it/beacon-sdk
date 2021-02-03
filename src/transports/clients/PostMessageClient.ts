import * as sodium from 'libsodium-wrappers'
import { windowRef } from '../../MockWindow'
import {
  ExtensionMessage,
  ExtensionMessageTarget,
  Origin,
  Serializer,
  ConnectionContext
} from '../..'
import {
  ExtendedPostMessagePairingResponse,
  PostMessagePairingResponse
} from '../../types/PostMessagePairingResponse'
import { EncryptedExtensionMessage } from '../../types/ExtensionMessage'
import { openCryptobox } from '../../utils/crypto'
import { getSenderId } from '../../utils/get-sender-id'
import { PostMessagePairingRequest } from '../../types/PostMessagePairingRequest'
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
    if (this.activeListeners.has(senderPublicKey)) {
      return
    }

    const callbackFunction = async (
      message: EncryptedExtensionMessage,
      context: ConnectionContext
    ): Promise<void> => {
      try {
        const decryptedMessage = await this.decryptMessage(
          senderPublicKey,
          message.encryptedPayload
        )
        // console.log('calculated sender ID', await getSenderId(senderPublicKey))
        // TODO: Add check for correct decryption key / sender ID
        messageCallback(decryptedMessage, context)
      } catch (decryptionError) {
        /* NO-OP. We try to decode every message, but some might not be addressed to us. */
      }
    }

    this.activeListeners.set(senderPublicKey, callbackFunction)
  }

  public async sendMessage(
    message: string,
    peer: PostMessagePairingRequest | ExtendedPostMessagePairingResponse
  ): Promise<void> {
    const payload = await this.encryptMessage(peer.publicKey, message)

    const targetId = (peer as ExtendedPostMessagePairingResponse)?.extensionId

    // if no targetId, we remove peer
    const msg: EncryptedExtensionMessage = {
      target: ExtensionMessageTarget.EXTENSION,
      encryptedPayload: payload,
      targetId
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    windowRef.postMessage(msg as any, windowRef.location.origin)
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: ExtendedPostMessagePairingResponse) => void
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = async (event: any): Promise<void> => {
      const data = event?.data?.message as ExtensionMessage<string>

      if (
        data &&
        data.target === ExtensionMessageTarget.PAGE &&
        (await this.isChannelOpenMessage(data))
      ) {
        const payload = Buffer.from(data.payload, 'hex')

        if (
          payload.length >=
          sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES
        ) {
          try {
            const pairingResponse: PostMessagePairingResponse = JSON.parse(
              await openCryptobox(payload, this.keyPair.publicKey, this.keyPair.privateKey)
            )

            messageCallback({
              ...pairingResponse,
              senderId: await getSenderId(pairingResponse.publicKey),
              extensionId: event?.data?.sender.id
            })
          } catch (decryptionError) {
            /* NO-OP. We try to decode every message, but some might not be addressed to us. */
          }
        }
      }
    }

    windowRef.addEventListener('message', fn)
  }

  public async sendPairingRequest(id: string): Promise<void> {
    const message: ExtensionMessage<string> = {
      target: ExtensionMessageTarget.EXTENSION,
      payload: await new Serializer().serialize(await this.getPairingRequestInfo()),
      targetId: id
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    windowRef.postMessage(message as any, windowRef.location.origin)
  }

  public async isChannelOpenMessage(message: any): Promise<boolean> {
    return typeof message === 'object' && message.hasOwnProperty('payload')
  }

  private async subscribeToMessages(): Promise<void> {
    windowRef.addEventListener('message', (message) => {
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
}
