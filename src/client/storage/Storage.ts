export enum StorageKey {
  COMMUNICATION_SECRET_KEY = 'beacon:communication-secret-key',
  COMMUNICATION_PEERS = 'beacon:communication-peers'
}

export interface StorageKeyReturnType {
  [StorageKey.COMMUNICATION_SECRET_KEY]: string | undefined
  [StorageKey.COMMUNICATION_PEERS]: string[]
}

export type StorageKeyReturnDefaults = { [key in StorageKey]: StorageKeyReturnType[key] }

export const defaultValues: StorageKeyReturnDefaults = {
  [StorageKey.COMMUNICATION_SECRET_KEY]: undefined,
  [StorageKey.COMMUNICATION_PEERS]: []
}

export abstract class Storage {
  public static isSupported(): Promise<boolean> { return Promise.resolve(false) }
  abstract get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]>
  abstract set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void>
  abstract delete<K extends StorageKey>(key: K): Promise<void>
}
