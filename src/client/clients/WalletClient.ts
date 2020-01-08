import {
  BaseMessage,
} from '../Messages'
import { Serializer } from '../Serializer'
import { ExposedPromise, exposedPromise } from '../utils/exposed-promise'
import { PostMessageTransport } from '../transports/PostMessageTransport'
import { P2PTransport } from '../transports/P2PTransport'
import { Transport } from '../transports/Transport'
import { Logger } from '../utils/Logger'
import { getStorage } from '../storage/getStorage'

const logger = new Logger('WalletClient')

export class WalletClient {
  private readonly serializer = new Serializer()

  private transport: Transport | undefined

  private readonly internalReady: ExposedPromise<boolean> = exposedPromise()

  public get ready(): Promise<boolean> {
    return this.internalReady.promise
  }

  public async init(transport?: Transport): Promise<boolean> {
    if (this.transport) {
      return true
    }

    const storage = await getStorage()

    if (transport) {
      this.transport = transport // Let users define their own transport
    } else if (await PostMessageTransport.isAvailable()) {
      this.transport = new PostMessageTransport() // Talk to extension first and relay everything
    } else if (await P2PTransport.isAvailable()) {
      this.transport = new P2PTransport(storage) // Establish our own connection with the wallet
    } else {
      throw new Error('no transport available for this platform!')
    }

    return true
  }

  public async connect(newMessageCallback: (message: BaseMessage) => void): Promise<boolean> {
    if (this.transport) {
      this.transport
        .addListener((message: string) => {
          const deserializedMessage = this.serializer.deserialize(message) as BaseMessage // TODO: Check type
          newMessageCallback(deserializedMessage)
        })
        .catch(error => logger.log(error))
      await this.transport.connect()
      this.internalReady.resolve(true)
    } else {
      this.internalReady.reject('no transport available')
    }

    return this.internalReady.promise
  }
}
