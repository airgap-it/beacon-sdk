import { ICommunicationPair, Permission } from '../interfaces'

export enum StorageKey {
  TRANSPORT_P2P_SECRET_KEY = 'beacon:communication-secret-key',
  TRANSPORT_P2P_PEERS = 'beacon:communication-peers',
  PERMISSIONS = 'beacon:permissions',
  BEACON_SDK_ID = 'beacon:sdk-id'
}

export interface StorageKeyReturnType {
  [StorageKey.TRANSPORT_P2P_SECRET_KEY]: string | undefined
  [StorageKey.TRANSPORT_P2P_PEERS]: ICommunicationPair[]
  [StorageKey.PERMISSIONS]: Permission[]
  [StorageKey.BEACON_SDK_ID]: string | undefined
}

export type StorageKeyReturnDefaults = { [key in StorageKey]: StorageKeyReturnType[key] }

export const defaultValues: StorageKeyReturnDefaults = {
  [StorageKey.TRANSPORT_P2P_SECRET_KEY]: undefined,
  [StorageKey.TRANSPORT_P2P_PEERS]: [],
  [StorageKey.PERMISSIONS]: [],
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
