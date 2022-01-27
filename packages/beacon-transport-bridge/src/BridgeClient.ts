import { crypto_secretbox_NONCEBYTES, crypto_secretbox_MACBYTES, KeyPair } from 'libsodium-wrappers'

import { windowRef, Serializer, getSenderId, MessageBasedClient } from '@airgap/beacon-core'

import { openCryptobox } from '@airgap/beacon-utils'
import {
  ExtensionMessage,
  ExtensionMessageTarget,
  Origin,
  ConnectionContext,
  ExtendedBridgePairingResponse,
  BridgePairingResponse,
  EncryptedExtensionMessage,
  BridgePairingRequest
} from '@airgap/beacon-types'

/**
 * @internalapi
 *
 *
 */
export class BridgeClient extends MessageBasedClient {
  protected readonly activeListeners: Map<
    string,
    (message: EncryptedExtensionMessage, context: ConnectionContext) => void
  > = new Map()

  constructor(name: string, keyPair: KeyPair, private readonly iFrame: HTMLIFrameElement) {
    super(name, keyPair)
  }

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

  public async sendMessage(message: string, peer: ExtendedBridgePairingResponse): Promise<void> {
    const payload = await this.encryptMessage(peer.publicKey, message)

    const targetId = peer.extensionId

    // if no targetId, we remove peer
    // TODO: EncryptedBridgeMessage
    const msg: EncryptedExtensionMessage = {
      target: ExtensionMessageTarget.EXTENSION,
      encryptedPayload: payload,
      targetId
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.iFrame.contentWindow!.postMessage(msg, 'https://airgap-it.github.io')
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: ExtendedBridgePairingResponse) => void
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = async (event: MessageEvent): Promise<void> => {
      const data: ExtensionMessage<string> = (() => {
        try {
          return JSON.parse(event.data)
        } catch {}
      })()

      if (data && (await this.isChannelOpenMessage(data))) {
        const payload = (() => {
          try {
            return Buffer.from(data.payload, 'hex')
          } catch {
            return Buffer.from('')
          }
        })()

        if (payload.length >= crypto_secretbox_NONCEBYTES + crypto_secretbox_MACBYTES) {
          try {
            const pairingResponse: BridgePairingResponse = JSON.parse(
              await openCryptobox(payload, this.keyPair.publicKey, this.keyPair.privateKey)
            )

            messageCallback({
              ...pairingResponse,
              senderId: await getSenderId(pairingResponse.publicKey),
              extensionId: 'PLACEHOLDER'
            })
          } catch (decryptionError) {
            /* NO-OP. We try to decode every message, but some might not be addressed to us. */
          }
        }
      }
    }

    windowRef.addEventListener('message', fn as any)
  }

  public async sendPairingRequest(id: string): Promise<void> {
    const message: ExtensionMessage<string> = {
      target: ExtensionMessageTarget.EXTENSION,
      payload: await new Serializer().serialize(await this.getPairingRequestInfo()),
      targetId: id
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.iFrame.contentWindow!.postMessage(message, windowRef.location.origin)
  }

  public async sendPairingResponse(pairingRequest: BridgePairingRequest): Promise<void> {
    const message: string = JSON.stringify(await this.getPairingResponseInfo(pairingRequest))

    const encryptedMessage: string = await this.encryptMessageAsymmetric(
      pairingRequest.publicKey,
      message
    )

    this.iFrame.contentWindow!.postMessage(encryptedMessage, 'https://airgap-it.github.io')
  }

  public async isChannelOpenMessage(message: any): Promise<boolean> {
    return typeof message === 'object' && message.hasOwnProperty('payload')
  }

  /**
   * Get the pairing response information. This will be shared with the peer during the connection setup
   */
  public async getPairingResponseInfo(
    request: any // TODO: Remove any; BridgePairingRequest
  ): Promise<any /* TODO: Remove any; BridgePairingResponse */> {
    const info: any = await super.getPairingResponseInfo(request as any)
    info.type = 'bridge-pairing-response'
    return info
  }

  private async subscribeToMessages(): Promise<void> {
    windowRef.addEventListener('message', ((event: MessageEvent) => {
      if ((event as any).source !== this.iFrame.contentWindow) {
        return
      }

      const data: EncryptedExtensionMessage<string> = (() => {
        try {
          return JSON.parse(event.data).payload
        } catch {}
      })()

      if (typeof data === 'object' && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any

        this.activeListeners.forEach((listener) => {
          listener(data, {
            origin: Origin.BRIDGE,
            id: 'PLACEHOLDER'
          })
        })
      }
    }) as any)
  }
}
