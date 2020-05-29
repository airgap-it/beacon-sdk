import { Storage, StorageKey, P2PPairInfo } from '..'
import { StorageManager } from './StorageManager'

export class PeerManager {
  private readonly storageManager: StorageManager<StorageKey.TRANSPORT_P2P_PEERS>

  constructor(storage: Storage) {
    this.storageManager = new StorageManager(storage, StorageKey.TRANSPORT_P2P_PEERS)
  }

  public async hasPeer(publicKey: string): Promise<boolean> {
    return this.getPeer(publicKey) ? true : false
  }

  public async getPeers(): Promise<P2PPairInfo[]> {
    return this.storageManager.getAll()
  }

  public async getPeer(publicKey: string): Promise<P2PPairInfo | undefined> {
    return this.storageManager.getOne((peer) => peer.publicKey === publicKey)
  }

  public async addPeer(peerInfo: P2PPairInfo): Promise<void> {
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
