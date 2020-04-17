import { StorageKeyReturnDefaults } from '../types/storage/StorageKeyReturnDefaults'
import { StorageKey } from '../types/storage/StorageKey'
import { StorageKeyReturnType } from '../types/storage/StorageKeyReturnType'

export const defaultValues: StorageKeyReturnDefaults = {
  [StorageKey.TRANSPORT_P2P_SECRET_KEY]: undefined,
  [StorageKey.TRANSPORT_P2P_PEERS]: [],
  [StorageKey.ACCOUNTS]: [],
  [StorageKey.ACTIVE_ACCOUNT]: undefined,
  [StorageKey.BEACON_SDK_ID]: undefined
}

export abstract class Storage {
  public static isSupported(): Promise<boolean> {
    return Promise.resolve(false)
  }
  abstract get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]>
  abstract set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void>
  abstract delete<K extends StorageKey>(key: K): Promise<void>
}
