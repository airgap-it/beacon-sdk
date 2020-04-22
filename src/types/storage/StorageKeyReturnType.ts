import { StorageKey, AccountInfo, AccountIdentifier, P2PPairInfo } from '../..'

export interface StorageKeyReturnType {
  [StorageKey.TRANSPORT_P2P_PEERS]: P2PPairInfo[]
  [StorageKey.ACCOUNTS]: AccountInfo[]
  [StorageKey.ACTIVE_ACCOUNT]: AccountIdentifier | undefined
  [StorageKey.BEACON_SDK_SECRET_SEED]: string | undefined
}
