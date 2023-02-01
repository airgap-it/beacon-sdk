import {
  ExtendedWalletConnectPairingResponse,
  PeerManager,
  StorageKey,
  Transport,
  WalletConnectPairingRequest
} from '@airgap/beacon-dapp'
import { KeyPair } from '@stablelib/ed25519'
import { WalletConnectCommunicationClient } from './communication-client/WalletConnectCommunicationClient'
import { Storage } from '@airgap/beacon-types'

/**
 * @internalapi
 *
 *
 */

export class WalletConnectTransport<
  T extends WalletConnectPairingRequest | ExtendedWalletConnectPairingResponse,
  K extends StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP
> extends Transport<T, K, WalletConnectCommunicationClient> {
  // public readonly type: TransportType = TransportType.WALLETCONNECT

  constructor(name: string, _keyPair: KeyPair, storage: Storage, storageKey: K) {
    super(name, new WalletConnectCommunicationClient(), new PeerManager<K>(storage, storageKey))
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  public async connect(): Promise<void> {
    // if (this._isConnected !== TransportStatus.NOT_CONNECTED) {
    //   return
    // }

    // logger.log('connect')
    // this._isConnected = TransportStatus.CONNECTING

    // await this.client.start()

    // const knownPeers = await this.getPeers()

    // if (knownPeers.length > 0) {
    //   logger.log('connect', `connecting to ${knownPeers.length} peers`)
    //   const connectionPromises = knownPeers.map(async (peer) => this.listen(peer.publicKey))
    //   Promise.all(connectionPromises).catch((error) => logger.error('connect', error))
    // }

    // await this.startOpenChannelListener()

    return super.connect()
  }

  public async disconnect(): Promise<void> {
    // await this.client.stop()

    return super.disconnect()
  }

  public async startOpenChannelListener(): Promise<void> {
    //
  }

  public async getPairingRequestInfo(): Promise<any> {
    // return this.client.getPairingRequestInfo()
  }

  public async listen(_publicKey: string): Promise<void> {
    // await this.client
    //   .listenForEncryptedMessage(publicKey, (message) => {
    //     const connectionContext: ConnectionContext = {
    //       origin: Origin.P2P,
    //       id: publicKey
    //     }
    //     this.notifyListeners(message, connectionContext).catch((error) => {
    //       throw error
    //     })
    //   })
    //   .catch((error) => {
    //     throw error
    //   })
  }
}
