import { Storage, StorageKey, StorageKeyReturnType } from '..'
import { StorageManager, ArrayElem } from './StorageManager'

/**
 * The PeerManager provides CRUD functionality for peer entities and persists them to the provided storage.
 */
export class PeerManager<
  T extends StorageKey.TRANSPORT_P2P_PEERS | StorageKey.TRANSPORT_POSTMESSAGE_PEERS
> {
  private readonly storageManager: StorageManager<T>

  constructor(storage: Storage, key: T) {
    this.storageManager = new StorageManager(storage, key)
  }

  public async hasPeer(publicKey: string): Promise<boolean> {
    return (await this.getPeer(publicKey)) ? true : false
  }

  public async getPeers(): Promise<StorageKeyReturnType[T]> {
    return this.storageManager.getAll()
  }

  public async getPeer(publicKey: string): Promise<ArrayElem<StorageKeyReturnType[T]> | undefined> {
    return this.storageManager.getOne((peer) => peer.publicKey === publicKey)
  }

  public async addPeer(peerInfo: ArrayElem<StorageKeyReturnType[T]>): Promise<void> {
    return this.storageManager.addOne(peerInfo, (peer) => peer.publicKey === peerInfo.publicKey)
  }

  public async removePeer(publicKey: string): Promise<void> {
    return this.storageManager.remove((peer) => peer.publicKey === publicKey)
  }

  public async removePeers(publicKeys: string[]): Promise<void> {
    return this.storageManager.remove((peer) => publicKeys.includes(peer.publicKey))
  }

  public async removeAllPeers(): Promise<void> {
    return this.storageManager.removeAll()
  }
}
