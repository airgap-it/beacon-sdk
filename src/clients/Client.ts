import { BaseMessage } from '../messages/Messages'
import { Serializer } from '../Serializer'
import { ExposedPromise, exposedPromise } from '../utils/exposed-promise'
import { PostMessageTransport } from '../transports/PostMessageTransport'
import { P2PTransport } from '../transports/P2PTransport'
import { Transport, TransportType, TransportStatus } from '../transports/Transport'
// Import { Logger } from '../utils/Logger'
import { getStorage } from '../storage/getStorage'
import { Permission } from '../interfaces'
import { Storage, StorageKey } from '../storage/Storage'

// Const logger = new Logger('BaseClient')

export class BaseClient {
  protected readonly name: string
  protected readonly serializer = new Serializer()
  protected handleResponse: (_event: BaseMessage, connectionInfo: any) => void

  protected storage: Storage | undefined
  protected transport: Transport | undefined

  protected readonly _isConnected: ExposedPromise<boolean> = exposedPromise()

  constructor(name: string) {
    this.name = name
    this.handleResponse = (_event: BaseMessage) => {
      throw new Error('not overwritten')
    }
  }

  public async init(isDapp: boolean = true, transport?: Transport): Promise<TransportType> {
    if (this.transport) {
      return this.transport.type
    }

    if (!this.storage) {
      this.storage = await getStorage()
    }

    if (transport) {
      this.transport = transport // Let users define their own transport
    } else if (await PostMessageTransport.isAvailable()) {
      this.transport = new PostMessageTransport(name) // Talk to extension first and relay everything
    } else if (await P2PTransport.isAvailable()) {
      this.transport = new P2PTransport(this.name, this.storage, isDapp) // Establish our own connection with the wallet
    } else {
      throw new Error('no transport available for this platform!')
    }

    return this.transport.type
  }

  public get isConnected(): Promise<boolean> {
    return this._isConnected.promise
  }

  public async getPeers(): Promise<string[]> {
    if (!this.transport) {
      throw new Error('no transport defined')
    }

    return this.transport.getPeers()
  }

  public async addPeer(id: string): Promise<void> {
    if (!this.transport) {
      throw new Error('no transport defined')
    }

    return this.transport.addPeer(id)
  }

  public async removePeer(id: string): Promise<void> {
    if (!this.transport) {
      throw new Error('no transport defined')
    }

    return this.transport.removePeer(id)
  }

  public async removeAllPeers(): Promise<void> {
    if (!this.transport) {
      throw new Error('no transport defined')
    }

    return this.transport.removeAllPeers()
  }

  public async getConnectedAccounts(): Promise<Permission[]> {
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    return this.storage.get(StorageKey.PERMISSIONS)
  }

  public async addConnectedAccount(permission: Permission): Promise<void> {
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    const permissions = await this.storage.get(StorageKey.PERMISSIONS)

    if (!permissions.some(element => element.pubkey === permission.pubkey)) {
      permissions.push(permission)
    }

    return this.storage.set(StorageKey.PERMISSIONS, permissions)
  }

  public async removeConnectedAccount(pubkey: string): Promise<void> {
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    const permissions = await this.storage.get(StorageKey.PERMISSIONS)

    const filteredPermissions = permissions.filter(permission => permission.pubkey !== pubkey)

    return this.storage.set(StorageKey.PERMISSIONS, filteredPermissions)
  }

  public async removaAllConnectedAccounts(): Promise<void> {
    if (!this.storage) {
      throw new Error('no storage defined')
    }

    return this.storage.delete(StorageKey.PERMISSIONS)
  }

  protected async _connect(): Promise<boolean> {
    if (this.transport && this.transport.connectionStatus === TransportStatus.NOT_CONNECTED) {
      await this.transport.connect()
      this.transport
        .addListener((message: string, connectionInfo: any) => {
          const deserializedMessage = this.serializer.deserialize(message) as BaseMessage // TODO: Check type
          this.handleResponse(deserializedMessage, connectionInfo)
        })
        .catch(error => console.log(error))
      this._isConnected.resolve(true)
    } else {
      this._isConnected.reject('no transport available')
    }

    return this._isConnected.promise
  }
}
