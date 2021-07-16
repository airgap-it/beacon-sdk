import { StorageKey, StorageKeyReturnType } from '../..'

/**
 * @internalapi
 */
export type StorageKeyReturnDefaults = { [key in StorageKey]: StorageKeyReturnType[key] }

/**
 * @internalapi
 */
export const defaultValues: StorageKeyReturnDefaults = {
  [StorageKey.TRANSPORT_P2P_PEERS_DAPP]: [],
  [StorageKey.TRANSPORT_P2P_PEERS_WALLET]: [],
  [StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP]: [],
  [StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET]: [],
  [StorageKey.ACCOUNTS]: [],
  [StorageKey.ACTIVE_ACCOUNT]: undefined,
  [StorageKey.PUSH_TOKENS]: [],
  [StorageKey.BEACON_SDK_SECRET_SEED]: undefined,
  [StorageKey.APP_METADATA_LIST]: [],
  [StorageKey.PERMISSION_LIST]: [],
  [StorageKey.BEACON_SDK_VERSION]: undefined,
  [StorageKey.MATRIX_PRESERVED_STATE]: {},
  [StorageKey.MATRIX_PEER_ROOM_IDS]: {},
  [StorageKey.MATRIX_SELECTED_NODE]: undefined,
  [StorageKey.MULTI_NODE_SETUP_DONE]: undefined
}
