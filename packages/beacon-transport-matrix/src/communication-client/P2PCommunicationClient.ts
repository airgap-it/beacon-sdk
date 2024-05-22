import {
  openCryptobox,
  encryptCryptoboxPayload,
  decryptCryptoboxPayload,
  secretbox_NONCEBYTES,
  secretbox_MACBYTES
} from '@airgap/beacon-utils'
import {
  Storage,
  P2PPairingRequest,
  ExtendedP2PPairingResponse,
  P2PPairingResponse,
  NodeDistributions
} from '@airgap/beacon-types'
import { BEACON_VERSION, getSenderId, Logger, CommunicationClient } from '@airgap/beacon-core'
import { ExposedPromise, generateGUID } from '@airgap/beacon-utils'
import { KeyPair } from '@stablelib/ed25519'
import { AcurastClient, Message } from '../dapp'

const logger = new Logger('PhoenixCommunicationClient')

const SERVER = 'wss://websocket-proxy.dev.gke.papers.tech'

/**
 * @internalapi
 */
export class P2PCommunicationClient extends CommunicationClient {
  private client: ExposedPromise<AcurastClient> = new ExposedPromise()

  private initialEvent: Message | undefined
  private initialListener: ((event: Message) => void) | undefined

  public relayServer:
    | ExposedPromise<{ server: string; timestamp: number; localTimestamp: number }>
    | undefined

  private readonly activeListeners: Map<string, (event: Message) => void> = new Map()

  constructor(
    private readonly name: string,
    keyPair: KeyPair,
    public readonly replicationCount: number,
    public readonly storage: Storage,
    _matrixNodes?: NodeDistributions,
    private readonly iconUrl?: string,
    private readonly appUrl?: string
  ) {
    super(keyPair)

    logger.log('constructor', 'PhoenixCommunicationClient created')
  }

  public async getPairingRequestInfo(): Promise<P2PPairingRequest> {
    const info: P2PPairingRequest = new P2PPairingRequest(
      await generateGUID(),
      this.name,
      (await this.getPublicKey()) + ':' + (await this.getCommunicationKey()).publicKey,
      BEACON_VERSION,
      ''
    )

    if (this.iconUrl) {
      info.icon = this.iconUrl
    }
    if (this.appUrl) {
      info.appUrl = this.appUrl
    }

    return info
  }

  public async getPairingResponseInfo(request: P2PPairingRequest): Promise<P2PPairingResponse> {
    const info: P2PPairingResponse = new P2PPairingResponse(
      request.id,
      this.name,
      (await this.getPublicKey()) + ':' + (await this.getCommunicationKey()).publicKey,
      request.version,
      ''
    )

    if (this.iconUrl) {
      info.icon = this.iconUrl
    }
    if (this.appUrl) {
      info.appUrl = this.appUrl
    }

    return info
  }

  public async getRelayServer(): Promise<{ server: string }> {
    return { server: SERVER }
  }
  private async getCommunicationKey(): Promise<{ privateKey: string; publicKey: string }> {
    let finalKey = await this.storage.get('communication-key' as any)

    if (finalKey) {
      console.log('HAVE KEY', finalKey)
      const publicKeyRaw = Buffer.from(finalKey.publicKey, 'hex')
      const publicKeyCompressedSize = (publicKeyRaw.length - 1) / 2
      const publicKeyCompressed = Buffer.concat([
        new Uint8Array([publicKeyRaw[2 * publicKeyCompressedSize] % 2 ? 3 : 2]),
        publicKeyRaw.subarray(1, publicKeyCompressedSize + 1)
      ])
      console.log('HAVE KEY2', publicKeyCompressed)

      return finalKey
    }

    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign']
    )

    const [privateKeyRaw, publicKeyRaw] = await Promise.all([
      crypto.subtle
        .exportKey('jwk', keyPair.privateKey)
        .then((jwk) => Buffer.from(jwk.d ?? '', 'base64')),
      crypto.subtle
        .exportKey('raw', keyPair.publicKey)
        .then((arrayBuffer) => Buffer.from(arrayBuffer))
    ])

    // const publicKeyCompressedSize = (publicKeyRaw.length - 1) / 2
    // const publicKeyCompressed = Buffer.concat([
    //   new Uint8Array([publicKeyRaw[2 * publicKeyCompressedSize] % 2 ? 3 : 2]),
    //   publicKeyRaw.subarray(1, publicKeyCompressedSize + 1)
    // ])
    // const publicKeyHash = await crypto.subtle.digest('SHA-256', publicKeyCompressed)

    finalKey = {
      privateKey: privateKeyRaw.toString('hex'),
      publicKey: publicKeyRaw.toString('hex')
    }

    await this.storage.set('communication-key' as any, finalKey)

    return finalKey
  }

  public async start(): Promise<void> {
    logger.log('start', 'starting client')

    logger.log('start', `connecting to server`)

    const relayServer: { server: string } = await this.getRelayServer()

    this.initialListener = async (event: Message): Promise<void> => {
      this.initialEvent = event
    }

    const acurastClient = new AcurastClient(relayServer.server)

    const finalKeyPair = await this.getCommunicationKey()

    await acurastClient.start({
      secretKey: finalKeyPair.privateKey,
      publicKey: finalKeyPair.publicKey
    })

    console.log('STARTING SERVER WITH ', finalKeyPair.publicKey)

    acurastClient.onMessage((event) => {
      const message = {
        sender: Buffer.from(event.sender).toString('hex'),
        recipient: Buffer.from(event.recipient).toString('hex'),
        payload: Buffer.from(event.payload).toString()
      }
      console.log('MESSAGE TEST', message)
    })

    logger.log('start', 'login successful, client is ready')
    this.client.resolve(acurastClient)
  }

  public async stop(): Promise<void> {
    logger.log('stop', 'stopping client')

    if (this.client.isResolved()) {
      await (await this.client.promise).close().catch((error: any) => logger.error(error))
    }
    await this.reset()
  }

  public async reset(): Promise<void> {
    logger.log('reset', 'resetting connection')

    // Instead of resetting everything, maybe we should make sure a new instance is created?
    this.relayServer = undefined
    this.client = new ExposedPromise()
    this.initialEvent = undefined
    this.initialListener = undefined
  }

  public async listenForEncryptedMessage(
    senderPublicKeyWrapper: string,
    messageCallback: (message: string) => void
  ): Promise<void> {
    const [senderEncryptionKey, _senderCommunicationKey] = senderPublicKeyWrapper.split(':')
    if (this.activeListeners.has(senderEncryptionKey)) {
      return
    }
    logger.log(
      'listenForEncryptedMessage',
      `start listening for encrypted messages from publicKey ${senderEncryptionKey}`
    )

    const sharedKey = await this.createCryptoBoxServer(senderEncryptionKey, this.keyPair!)

    const callbackFunction = async (event: Message): Promise<void> => {
      const message = {
        sender: Buffer.from(event.sender).toString('hex'),
        recipient: Buffer.from(event.recipient).toString('hex'),
        payload: Buffer.from(event.payload).toString('hex')
      }
      console.log('MESSAGE listenForEncryptedMessage', message)

      let payload

      try {
        payload = Buffer.from(message.payload, 'hex')
        // content can be non-hex if it's a connection open request
      } catch {
        /* */
      }
      if (payload && payload.length >= secretbox_NONCEBYTES + secretbox_MACBYTES) {
        try {
          const decryptedMessage = await decryptCryptoboxPayload(payload, sharedKey.receive)

          logger.log(
            'listenForEncryptedMessage',
            `received a message from ${senderEncryptionKey}`,
            decryptedMessage
          )

          // logger.log(
          //   'listenForEncryptedMessage',
          //   'encrypted message received',
          //   decryptedMessage,
          //   await new Serializer().deserialize(decryptedMessage)
          // )
          // console.log('calculated sender ID', await getSenderId(senderPublicKey))
          // TODO: Add check for correct decryption key / sender ID

          messageCallback(decryptedMessage)
        } catch (decryptionError) {
          /* NO-OP. We try to decode every message, but some might not be addressed to us. */
        }
      }
    }

    this.activeListeners.set(senderEncryptionKey, callbackFunction)
    ;(await this.client.promise).onMessage(callbackFunction)

    const lastEvent = this.initialEvent
    if (lastEvent) {
      logger.log('listenForEncryptedMessage', 'Handling previous event')
      await callbackFunction(lastEvent)
    } else {
      logger.log('listenForEncryptedMessage', 'No previous event found')
    }

    const initialListener = this.initialListener
    if (initialListener) {
      // TODO: Can't unsubscribe
      // ;(await this.client.promise).unsubscribe('TODO:EVENT_TYPE_MESSAGE', initialListener)
    }
    this.initialListener = undefined
    this.initialEvent = undefined
  }

  public async unsubscribeFromEncryptedMessage(senderPublicKey: string): Promise<void> {
    console.log('UNSUBSCRIBE', senderPublicKey)
    const listener = this.activeListeners.get(senderPublicKey)
    if (!listener) {
      return
    }

    // ;(await this.client.promise).unsubscribe('TODO:EVENT_TYPE_MESSAGE', listener)

    this.activeListeners.delete(senderPublicKey)
  }

  public async unsubscribeFromEncryptedMessages(): Promise<void> {
    // ;(await this.client.promise).unsubscribeAll('TODO:EVENT_TYPE_MESSAGE')

    this.activeListeners.clear()
  }

  public async sendMessage(
    message: string,
    peer: P2PPairingRequest | ExtendedP2PPairingResponse
  ): Promise<void> {
    const [senderEncryptionKey, senderCommunicationKey] = peer.publicKey.split(':')

    const sharedKey = await this.createCryptoBoxClient(senderEncryptionKey, this.keyPair!)

    const encryptedMessage = await encryptCryptoboxPayload(message, sharedKey.send)

    logger.log('sendMessage', 'sending encrypted message', senderCommunicationKey, message)

    const publicKeyCompressed = await this.compressPublicKey(senderCommunicationKey)

    ;(await this.client.promise)
      .send(publicKeyCompressed, encryptedMessage)
      .catch(async (error: any) => {
        logger.log(`sendMessage`, `unexpected error`, error)
      })
  }

  public async listenForChannelOpening(
    messageCallback: (pairingResponse: ExtendedP2PPairingResponse) => void
  ): Promise<void> {
    logger.debug(`listenForChannelOpening`)
    ;(await this.client.promise).onMessage(async (event) => {
      const message = {
        sender: Buffer.from(event.sender).toString('hex'),
        recipient: Buffer.from(event.recipient).toString('hex'),
        payload: Buffer.from(event.payload).toString()
      }
      console.log('MESSAGE listenForChannelOpening', message)

      if (
        this.isTextMessage(message.payload) &&
        (await this.isChannelOpenMessage(message.payload))
      ) {
        logger.log(
          `listenForChannelOpening`,
          `channel opening received, trying to decrypt`,
          JSON.stringify(event)
        )

        const splits = message.payload.split(':')
        const payload = Buffer.from(splits[splits.length - 1], 'hex')

        if (payload.length >= secretbox_NONCEBYTES + secretbox_MACBYTES) {
          try {
            const pairingResponse: P2PPairingResponse = JSON.parse(
              await openCryptobox(payload, this.keyPair!.publicKey, this.keyPair!.secretKey)
            )

            logger.log(
              `listenForChannelOpening`,
              `channel opening received and decrypted`,
              JSON.stringify(pairingResponse)
            )

            const [senderEncryptionKey, _senderCommunicationKey] =
              pairingResponse.publicKey.split(':')

            messageCallback({
              ...pairingResponse,
              senderId: await getSenderId(senderEncryptionKey)
            })
          } catch (decryptionError) {
            /* NO-OP. We try to decode every message, but some might not be addressed to us. */
          }
        }
      }
    })
  }

  public async sendPairingResponse(pairingRequest: P2PPairingRequest): Promise<void> {
    logger.log(`sendPairingResponse`)

    logger.debug(`sendPairingResponse`, `Successfully joined room.`)

    // TODO: remove v1 backwards-compatibility
    const message: string = JSON.stringify(await this.getPairingResponseInfo(pairingRequest)) // v2

    logger.debug(`sendPairingResponse`, `Sending pairing response`, message)

    const [senderEncryptionKey, senderCommunicationKey] = pairingRequest.publicKey.split(':')

    const encryptedMessage: string = await this.encryptMessageAsymmetric(
      senderEncryptionKey,
      message
    )

    const msg = ['@channel-open', encryptedMessage].join(':')

    const publicKeyCompressed = await this.compressPublicKey(senderCommunicationKey)

    ;(await this.client.promise).send(publicKeyCompressed, msg).catch(async (error: any) => {
      logger.log(`sendPairingResponse`, `unexpected error`, error)
    })
  }

  public isTextMessage(_content: any): boolean {
    // TODO
    return true
  }

  public async isChannelOpenMessage(message: string): Promise<boolean> {
    return message.startsWith(`@channel-open:`)
  }

  public async isSender(sender: string, senderPublicKey: string): Promise<boolean> {
    return sender === senderPublicKey
  }

  private async compressPublicKey(senderCommunicationKey: string) {
    const publicKeyRaw = Buffer.from(senderCommunicationKey, 'hex')

    const publicKeyCompressedSize = (publicKeyRaw.length - 1) / 2
    return Buffer.concat([
      new Uint8Array([publicKeyRaw[2 * publicKeyCompressedSize] % 2 ? 3 : 2]),
      publicKeyRaw.subarray(1, publicKeyCompressedSize + 1)
    ])
  }
}
