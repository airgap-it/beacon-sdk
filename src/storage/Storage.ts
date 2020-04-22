import { StorageKey } from '../types/storage/StorageKey'
import { StorageKeyReturnType } from '../types/storage/StorageKeyReturnType'

export abstract class Storage {
  public static isSupported(): Promise<boolean> {
    return Promise.resolve(false)
  }
  abstract get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]>
  abstract set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void>
  abstract delete<K extends StorageKey>(key: K): Promise<void>
}
