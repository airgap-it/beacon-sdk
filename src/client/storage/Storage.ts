import { ICommunicationPair } from '../interfaces'

export enum StorageKey {
  TRANSPORT_P2P_SECRET_KEY = 'beacon:communication-secret-key',
  TRANSPORT_P2P_PEERS = 'beacon:communication-peers'
}

export interface StorageKeyReturnType {
  [StorageKey.TRANSPORT_P2P_SECRET_KEY]: string | undefined
  [StorageKey.TRANSPORT_P2P_PEERS]: ICommunicationPair[]
}

export type StorageKeyReturnDefaults = { [key in StorageKey]: StorageKeyReturnType[key] }

export const defaultValues: StorageKeyReturnDefaults = {
  [StorageKey.TRANSPORT_P2P_SECRET_KEY]: undefined,
  [StorageKey.TRANSPORT_P2P_PEERS]: []
}

export abstract class Storage {
  public static isSupported(): Promise<boolean> {
    return Promise.resolve(false)
  }
  abstract get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]>
  abstract set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void>
  abstract delete<K extends StorageKey>(key: K): Promise<void>
}
