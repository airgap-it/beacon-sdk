import { StorageKey, StorageKeyReturnType } from '@airgap/beacon-types'

/**
 * @internalapi
 *
 * The storage used in the SDK
 */
export abstract class Storage {
  /**
   * Returns a promise that resolves to true if the storage option is available on this platform.
   */
  public static isSupported(): Promise<boolean> {
    return Promise.resolve(false)
  }

  /**
   * Gets a value from storage and returns it
   *
   * @param key The storage key
   */
  abstract get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]>

  /**
   * Sets a value in the storage and persist it
   *
   * @param key The storage key
   * @param value The value to be persisted
   */
  abstract set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void>

  /**
   * Delete a key from storage
   *
   * @param key The storage key
   */
  abstract delete<K extends StorageKey>(key: K): Promise<void>

  /**
   * This event will fire if the storage was modified by someone else, eg. on another tab
   *
   * @param callback The callback to be called when a storage value changes
   */
  abstract subscribeToStorageChanged(
    callback: (arg: {
      eventType: 'storageCleared' | 'entryModified'
      key: string | null
      oldValue: string | null
      newValue: string | null
    }) => {}
  ): Promise<void>

  /**
   * Get the key with the internal prefix
   *
   * @param key the storage key
   */
  abstract getPrefixedKey<K extends StorageKey>(key: K): string
}
