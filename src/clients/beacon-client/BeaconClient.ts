import * as sodium from 'libsodium-wrappers'
import { ExposedPromise } from '../../utils/exposed-promise'
import { generateGUID } from '../../utils/generate-uuid'
import { getKeypairFromSeed, toHex } from '../../utils/crypto'
import { Storage, StorageKey } from '../..'
import { BeaconEventHandler } from '../../events'
import { BeaconClientOptions } from './BeaconClientOptions'

export abstract class BeaconClient {
  protected readonly name: string

  protected storage: Storage

  protected readonly events: BeaconEventHandler = new BeaconEventHandler()

  protected _beaconId: ExposedPromise<string> = new ExposedPromise()
  protected get beaconId(): Promise<string> {
    return this._beaconId.promise
  }

  protected _keyPair: ExposedPromise<sodium.KeyPair> = new ExposedPromise()
  protected get keyPair(): Promise<sodium.KeyPair> {
    return this._keyPair.promise
  }

  constructor(config: BeaconClientOptions) {
    this.name = config.name
    this.storage = config.storage

    this.loadOrCreateBeaconSecret().catch(console.error)
    this.keyPair
      .then((keyPair) => {
        this._beaconId.resolve(toHex(keyPair.publicKey))
      })
      .catch(console.error)
  }

  private async loadOrCreateBeaconSecret(): Promise<void> {
    const storageValue: unknown = await this.storage.get(StorageKey.BEACON_SDK_SECRET_SEED)
    if (storageValue && typeof storageValue === 'string') {
      this._keyPair.resolve(getKeypairFromSeed(storageValue))
    } else {
      const key = generateGUID()
      await this.storage.set(StorageKey.BEACON_SDK_SECRET_SEED, key)
      this._keyPair.resolve(getKeypairFromSeed(key))
    }
  }
}
