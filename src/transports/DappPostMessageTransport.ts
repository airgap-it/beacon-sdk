import * as sodium from 'libsodium-wrappers'
import { TransportStatus, StorageKey, PostMessageTransport, Storage } from '..'
import { Logger } from '../utils/Logger'
import { ExtendedPostMessagePairingResponse } from '../types/PostMessagePairingResponse'

const logger = new Logger('DappPostMessageTransport')

export class DappPostMessageTransport extends PostMessageTransport<
  ExtendedPostMessagePairingResponse,
  StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP
> {
  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage) {
    super(name, keyPair, storage, StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP)
  }

  public async startOpenChannelListener(): Promise<void> {
    await this.client.listenForChannelOpening(async (peer: ExtendedPostMessagePairingResponse) => {
      logger.log('connect', `received PostMessagePairingResponse`, peer)

      await this.addPeer(peer)

      this._isConnected = TransportStatus.CONNECTED

      if (this.newPeerListener) {
        this.newPeerListener(peer)
        this.newPeerListener = undefined // TODO: Remove this once we use the id
      }
    })
  }

  public async listenForNewPeer(
    newPeerListener: (peer: ExtendedPostMessagePairingResponse) => void
  ): Promise<void> {
    logger.log('listenForNewPeer')
    this.newPeerListener = newPeerListener
  }

  public async stopListeningForNewPeers(): Promise<void> {
    logger.log('stopListeningForNewPeers')
    this.newPeerListener = undefined
  }
}
