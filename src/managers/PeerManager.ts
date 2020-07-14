import { Storage, StorageKey, PeerInfo } from '..'
import { StorageManager } from './StorageManager'

export class PeerManager {
  private readonly storageManager: StorageManager<
    StorageKey.TRANSPORT_P2P_PEERS | StorageKey.TRANSPORT_POSTMESSAGE_PEERS
  >

  constructor(
    storage: Storage,
    key: StorageKey.TRANSPORT_P2P_PEERS | StorageKey.TRANSPORT_POSTMESSAGE_PEERS
  ) {
    this.storageManager = new StorageManager(storage, key)
  }

  public async hasPeer(publicKey: string): Promise<boolean> {
    return (await this.getPeer(publicKey)) ? true : false
  }

  public async getPeers(): Promise<PeerInfo[]> {
    return this.storageManager.getAll()
  }

  public async getPeer(publicKey: string): Promise<PeerInfo | undefined> {
    return this.storageManager.getOne((peer) => peer.publicKey === publicKey)
  }

  public async addPeer(peerInfo: PeerInfo): Promise<void> {
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
