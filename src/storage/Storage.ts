import { ICommunicationPair } from '../interfaces'
import { AccountInfo, AccountIdentifier } from '../clients/Client'

export enum StorageKey {
  TRANSPORT_P2P_SECRET_KEY = 'beacon:communication-secret-key',
  TRANSPORT_P2P_PEERS = 'beacon:communication-peers',
  ACCOUNTS = 'beacon:accounts',
  ACTIVE_ACCOUNT = 'beacon:active-account',
  BEACON_SDK_ID = 'beacon:sdk-id'
}

export interface StorageKeyReturnType {
  [StorageKey.TRANSPORT_P2P_SECRET_KEY]: string | undefined
  [StorageKey.TRANSPORT_P2P_PEERS]: ICommunicationPair[]
  [StorageKey.ACCOUNTS]: AccountInfo[]
  [StorageKey.ACTIVE_ACCOUNT]: AccountIdentifier | undefined
  [StorageKey.BEACON_SDK_ID]: string | undefined
}

export type StorageKeyReturnDefaults = { [key in StorageKey]: StorageKeyReturnType[key] }

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
