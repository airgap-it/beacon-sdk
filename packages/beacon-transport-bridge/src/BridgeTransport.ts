import { KeyPair } from 'libsodium-wrappers'

import {
  PostMessagePairingRequest,
  ExtendedPostMessagePairingResponse,
  StorageKey,
  TransportType,
  TransportStatus,
  ConnectionContext,
  Origin
} from '@airgap/beacon-types'
import { Storage } from '@airgap/beacon-types'
import { Transport, PeerManager, Logger, windowRef } from '@airgap/beacon-core'
import { BridgeClient } from './BridgeClient'

const logger = new Logger('BridgeTransport')

const createBeaconBridge = () => {
  var iframe = document.createElement('iframe')
  iframe.setAttribute(
    'src',
    `https://airgap-it.github.io/beacon-iframe-bridge/bridge.html?parent=${encodeURIComponent(
      windowRef.location.origin
    )}`
  )
  iframe.setAttribute('style', 'position: absolute; width:0; height:0; border:0;')
  window.addEventListener('load', () => {
    document.body.appendChild(iframe)
    windowRef.addEventListener('message', (msg) => {
      console.log('MESSAGE FROM IFRAME', msg)
    })
  })

  return iframe
}

const iFrame = createBeaconBridge()

/**
 * @internalapi
 *
 *
 */
export class BridgeTransport<
  T extends PostMessagePairingRequest | ExtendedPostMessagePairingResponse,
  K extends
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET
> extends Transport<T, K, any> {
  public readonly type: any /* Remove  */ = TransportType.BRIDGE

  constructor(name: string, keyPair: KeyPair, storage: Storage, storageKey: K) {
    super(name, new BridgeClient(name, keyPair, iFrame), new PeerManager<K>(storage, storageKey))
  }

  public static async isAvailable(): Promise<boolean> {
    return true
  }

  public async connect(): Promise<void> {
    if (this._isConnected !== TransportStatus.NOT_CONNECTED) {
      return
    }

    this._isConnected = TransportStatus.CONNECTING

    const knownPeers = await this.getPeers()

    if (knownPeers.length > 0) {
      logger.log('connect', `connecting to ${knownPeers.length} peers`)
      const connectionPromises = knownPeers.map(async (peer) => this.listen(peer.publicKey))

      Promise.all(connectionPromises).catch((error) => logger.error('connect', error))
    }

    await this.startOpenChannelListener()

    await super.connect()
  }

  public async startOpenChannelListener(): Promise<void> {
    //
  }

  public async getPairingRequestInfo(): Promise<PostMessagePairingRequest> {
    return this.client.getPairingRequestInfo()
  }

  public async listen(publicKey: string): Promise<void> {
    logger.log('listen', publicKey)

    await this.client
      .listenForEncryptedMessage(publicKey, (message: string, context: ConnectionContext) => {
        const connectionContext: ConnectionContext = {
          origin: Origin.BRIDGE,
          id: context.id
        }

        this.notifyListeners(message, connectionContext).catch((error) => {
          throw error
        })
      })
      .catch((error: any) => {
        throw error
      })
  }
}
