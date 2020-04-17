import { StorageKey, AccountInfo, AccountIdentifier, ICommunicationPair } from '../..'

export interface StorageKeyReturnType {
  [StorageKey.TRANSPORT_P2P_SECRET_KEY]: string | undefined
  [StorageKey.TRANSPORT_P2P_PEERS]: ICommunicationPair[]
  [StorageKey.ACCOUNTS]: AccountInfo[]
  [StorageKey.ACTIVE_ACCOUNT]: AccountIdentifier | undefined
  [StorageKey.BEACON_SDK_ID]: string | undefined
}
