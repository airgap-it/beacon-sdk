import { StorageKey, StorageKeyReturnType } from '../..'

export type StorageKeyReturnDefaults = { [key in StorageKey]: StorageKeyReturnType[key] }

export const defaultValues: StorageKeyReturnDefaults = {
  [StorageKey.TRANSPORT_P2P_PEERS]: [],
  [StorageKey.ACCOUNTS]: [],
  [StorageKey.ACTIVE_ACCOUNT]: undefined,
  [StorageKey.BEACON_SDK_SECRET_SEED]: undefined
}
