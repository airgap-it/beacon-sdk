import { KeyPair } from 'libsodium-wrappers'
import { Logger, Transport, PeerManager } from '@airgap/beacon-core'
import {
  ConnectionContext,
  ExtendedP2PPairingResponse,
  Storage,
  StorageKey,
  TransportStatus,
  TransportType,
  Origin,
  P2PPairingRequest
} from '@airgap/beacon-types'
import { P2PCommunicationClient } from '@airgap/beacon-transport-matrix'

const logger = new Logger('P2PTransport')

/**
 * @internalapi
 *
 *
 */
export class P2PTransport<
  T extends P2PPairingRequest | ExtendedP2PPairingResponse,
  K extends StorageKey.TRANSPORT_P2P_PEERS_DAPP | StorageKey.TRANSPORT_P2P_PEERS_WALLET
> extends Transport<T, K, P2PCommunicationClient> {
  public readonly type: any /* TODO: Remove any */ = TransportType.P2P

  constructor(
    name: string,
    keyPair: KeyPair,
    storage: Storage,
    matrixNodes: string[],
    storageKey: K,
    iconUrl?: string,
    appUrl?: string
  ) {
    super(
      name,
      new P2PCommunicationClient(name, keyPair, 1, storage, matrixNodes, iconUrl, appUrl),
      new PeerManager<K>(storage, storageKey)
    )
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  public async connect(): Promise<void> {
    if (this._isConnected !== TransportStatus.NOT_CONNECTED) {
      return
    }

    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTING

    await this.client.start()

    const knownPeers = await this.getPeers()

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async (peer) => this.listen(peer.publicKey))
      Promise.all(connectionPromises).catch((error) => logger.error('connect', error))
    }

    await this.startOpenChannelListener()

    return super.connect()
  }

  public async disconnect(): Promise<void> {
    await this.client.stop()

    return super.disconnect()
  }

  public async startOpenChannelListener(): Promise<void> {
    //
  }

  public async getPairingRequestInfo(): Promise<P2PPairingRequest> {
    return this.client.getPairingRequestInfo()
  }

  public async listen(publicKey: string): Promise<void> {
    await this.client
      .listenForEncryptedMessage(publicKey, (message) => {
        const connectionContext: ConnectionContext = {
          origin: Origin.P2P,
          id: publicKey
        }

        this.notifyListeners(message, connectionContext as any /* TODO: Remove as any */).catch(
          (error) => {
            throw error
          }
        )
      })
      .catch((error) => {
        throw error
      })
  }
}
