import {
  StorageKey,
  AccountInfo,
  AccountIdentifier,
  P2PPairingRequest,
  AppMetadata,
  PermissionInfo
} from '../..'
import { MatrixState } from '../../matrix-client/MatrixClientStore'

export interface StorageKeyReturnType {
  [StorageKey.TRANSPORT_P2P_PEERS]: P2PPairingRequest[]
  [StorageKey.ACCOUNTS]: AccountInfo[]
  [StorageKey.ACTIVE_ACCOUNT]: AccountIdentifier | undefined
  [StorageKey.BEACON_SDK_SECRET_SEED]: string | undefined
  [StorageKey.APP_METADATA_LIST]: AppMetadata[]
  [StorageKey.PERMISSION_LIST]: PermissionInfo[]
  [StorageKey.BEACON_SDK_VERSION]: string | undefined
  [StorageKey.MATRIX_PRESERVED_STATE]: Partial<MatrixState>
}
