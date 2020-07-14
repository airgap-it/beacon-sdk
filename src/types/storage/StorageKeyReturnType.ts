import {
  StorageKey,
  AccountInfo,
  AccountIdentifier,
  P2PPairingRequest,
  AppMetadata,
  PermissionInfo
} from '../..'
import { MatrixState } from '../../matrix-client/MatrixClientStore'
import { PostMessagePairingRequest } from '../PostMessagePairingRequest'

export interface StorageKeyReturnType {
  [StorageKey.TRANSPORT_P2P_PEERS]: P2PPairingRequest[]
  [StorageKey.TRANSPORT_POSTMESSAGE_PEERS]: PostMessagePairingRequest[]
  [StorageKey.ACCOUNTS]: AccountInfo[]
  [StorageKey.ACTIVE_ACCOUNT]: AccountIdentifier | undefined
  [StorageKey.BEACON_SDK_SECRET_SEED]: string | undefined
  [StorageKey.APP_METADATA_LIST]: AppMetadata[]
  [StorageKey.PERMISSION_LIST]: PermissionInfo[]
  [StorageKey.BEACON_SDK_VERSION]: string | undefined
  [StorageKey.MATRIX_PRESERVED_STATE]: Partial<MatrixState>
}
