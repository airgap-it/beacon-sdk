import * as sodium from 'libsodium-wrappers'
import { ExposedPromise } from '../../utils/exposed-promise'
import { generateGUID } from '../../utils/generate-uuid'
import { getKeypairFromSeed, toHex } from '../../utils/crypto'
import { Storage, StorageKey } from '../..'
import { BeaconEventHandler } from '../../events'
import { SDK_VERSION } from '../../constants'
import { BeaconClientOptions } from './BeaconClientOptions'

export abstract class BeaconClient {
  public readonly name: string
  protected _beaconId: ExposedPromise<string> = new ExposedPromise()
  public get beaconId(): Promise<string> {
    return this._beaconId.promise
  }

  protected storage: Storage

  protected readonly events: BeaconEventHandler = new BeaconEventHandler()

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

  private async loadOrCreateBeaconSecret(): Promise<void> {
    const storageValue: unknown = await this.storage.get(StorageKey.BEACON_SDK_SECRET_SEED)
    if (storageValue && typeof storageValue === 'string') {
      this._keyPair.resolve(await getKeypairFromSeed(storageValue))
    } else {
      const key = generateGUID()
      await this.storage.set(StorageKey.BEACON_SDK_SECRET_SEED, key)
      this._keyPair.resolve(await getKeypairFromSeed(key))
    }
  }
}
