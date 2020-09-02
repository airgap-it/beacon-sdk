import * as sodium from 'libsodium-wrappers'
import { ExposedPromise } from '../../utils/exposed-promise'
import { generateGUID } from '../../utils/generate-uuid'
import { getKeypairFromSeed, toHex } from '../../utils/crypto'
import { Storage, StorageKey } from '../..'
import { BeaconEventHandler } from '../../events'
import { SDK_VERSION } from '../../constants'
import { BeaconClientOptions } from './BeaconClientOptions'

/**
 * The beacon client is an abstract client that handles everything that is shared between all other clients.
 * Specifically, it handles managing the beaconId and and the local keypair.
 */
export abstract class BeaconClient {
  /**
   * The name of the client
   */
  public readonly name: string

  /** The beaconId is a public key that is used to identify one specific application (dapp or wallet).
   * This is used inside a message to specify the sender, for example.
   */
  protected _beaconId: ExposedPromise<string> = new ExposedPromise()
  public get beaconId(): Promise<string> {
    return this._beaconId.promise
  }

  protected storage: Storage

  protected readonly events: BeaconEventHandler = new BeaconEventHandler()

  /**
   * The local keypair that is used for the communication encryption
   */
  protected _keyPair: ExposedPromise<sodium.KeyPair> = new ExposedPromise()
  protected get keyPair(): Promise<sodium.KeyPair> {
    return this._keyPair.promise
  }

  constructor(config: BeaconClientOptions) {
    this.name = config.name
    this.storage = config.storage

    this.storage.set(StorageKey.BEACON_SDK_VERSION, SDK_VERSION).catch(console.error)

    this.loadOrCreateBeaconSecret().catch(console.error)
    this.keyPair
      .then((keyPair) => {
        this._beaconId.resolve(toHex(keyPair.publicKey))
      })
      .catch(console.error)
  }

  /**
   * This method tries to load the seed from storage, if it doesn't exist, a new one will be created and persisted.
   */
  private async loadOrCreateBeaconSecret(): Promise<void> {
    const storageValue: unknown = await this.storage.get(StorageKey.BEACON_SDK_SECRET_SEED)
    if (storageValue && typeof storageValue === 'string') {
      this._keyPair.resolve(await getKeypairFromSeed(storageValue))
    } else {
      const key = await generateGUID()
      await this.storage.set(StorageKey.BEACON_SDK_SECRET_SEED, key)
      this._keyPair.resolve(await getKeypairFromSeed(key))
    }
  }
}
