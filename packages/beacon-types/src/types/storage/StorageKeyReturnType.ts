import {
  StorageKey,
  AccountInfo,
  AccountIdentifier,
  P2PPairingRequest,
  AppMetadata,
  PermissionInfo,
  ExtendedWalletConnectPairingResponse,
  RequestProofOfEventChallengeInput
} from '../..'
// TODO: MOVE TYPE import { MatrixState } from '../../matrix-client/MatrixClientStore'
import { ExtendedP2PPairingResponse } from '../P2PPairingResponse'
import { PostMessagePairingRequest } from '../PostMessagePairingRequest'
import { ExtendedPostMessagePairingResponse } from '../PostMessagePairingResponse'
import { PushToken } from '../PushToken'

/**
 * @internalapi
 */
export interface StorageKeyReturnType {
  [StorageKey.TRANSPORT_P2P_PEERS_DAPP]: P2PPairingRequest[]
  [StorageKey.TRANSPORT_P2P_PEERS_WALLET]: ExtendedP2PPairingResponse[]
  [StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP]: PostMessagePairingRequest[]
  [StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET]: ExtendedPostMessagePairingResponse[]
  [StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP]: ExtendedWalletConnectPairingResponse[]
  [StorageKey.LAST_SELECTED_WALLET]: string | undefined
  [StorageKey.ACCOUNTS]: AccountInfo[]
  [StorageKey.ACTIVE_ACCOUNT]: AccountIdentifier | undefined
  [StorageKey.PUSH_TOKENS]: PushToken[]
  [StorageKey.BEACON_SDK_SECRET_SEED]: string | undefined
  [StorageKey.APP_METADATA_LIST]: AppMetadata[]
  [StorageKey.PERMISSION_LIST]: PermissionInfo[]
  [StorageKey.ONGOING_PROOF_OF_EVENT_CHALLENGES]: ({
    contractAddress: string
    accountIdentifier: string
  } & RequestProofOfEventChallengeInput)[]
  [StorageKey.BEACON_SDK_VERSION]: string | undefined
  [StorageKey.MATRIX_PRESERVED_STATE]: { [key: string]: unknown } // TODO: TYPE Partial<MatrixState>
  [StorageKey.MATRIX_PEER_ROOM_IDS]: { [key: string]: string | undefined }
  [StorageKey.MATRIX_SELECTED_NODE]: string | undefined
  [StorageKey.MULTI_NODE_SETUP_DONE]: boolean | undefined
  [StorageKey.WC_2_CLIENT_SESSION]: string | undefined
  [StorageKey.WC_2_CORE_PAIRING]: string | undefined,
  [StorageKey.WC_2_CORE_KEYCHAIN]: string | undefined,
  [StorageKey.WC_2_CORE_MESSAGES]: string | undefined, 
  [StorageKey.WC_2_CLIENT_PROPOSAL]: string | undefined, 
  [StorageKey.WC_2_CORE_SUBSCRIPTION]: string | undefined, 
  [StorageKey.WC_2_CORE_HISTORY]: string | undefined, 
  [StorageKey.WC_2_CORE_EXPIRER]: string | undefined, 
}
