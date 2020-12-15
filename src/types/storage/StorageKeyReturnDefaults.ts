import { StorageKey, StorageKeyReturnType } from '../..'

export type StorageKeyReturnDefaults = { [key in StorageKey]: StorageKeyReturnType[key] }

export const defaultValues: StorageKeyReturnDefaults = {
  [StorageKey.TRANSPORT_P2P_PEERS_DAPP]: [],
  [StorageKey.TRANSPORT_P2P_PEERS_WALLET]: [],
  [StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP]: [],
  [StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET]: [],
  [StorageKey.ACCOUNTS]: [],
  [StorageKey.ACTIVE_ACCOUNT]: undefined,
  [StorageKey.ACTIVE_PEER]: undefined,
  [StorageKey.BEACON_SDK_SECRET_SEED]: undefined,
  [StorageKey.APP_METADATA_LIST]: [],
  [StorageKey.PERMISSION_LIST]: [],
  [StorageKey.BEACON_SDK_VERSION]: undefined,
  [StorageKey.MATRIX_PRESERVED_STATE]: {}
}
