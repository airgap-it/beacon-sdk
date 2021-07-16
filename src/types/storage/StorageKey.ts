/**
 * @internalapi
 */
export enum StorageKey {
  TRANSPORT_P2P_PEERS_DAPP = 'beacon:communication-peers-dapp',
  TRANSPORT_P2P_PEERS_WALLET = 'beacon:communication-peers-wallet',
  TRANSPORT_POSTMESSAGE_PEERS_DAPP = 'beacon:postmessage-peers-dapp',
  TRANSPORT_POSTMESSAGE_PEERS_WALLET = 'beacon:postmessage-peers-wallet',
  ACCOUNTS = 'beacon:accounts',
  ACTIVE_ACCOUNT = 'beacon:active-account',
  PUSH_TOKENS = 'beacon:push-tokens',
  BEACON_SDK_SECRET_SEED = 'beacon:sdk-secret-seed',
  APP_METADATA_LIST = 'beacon:app-metadata-list',
  PERMISSION_LIST = 'beacon:permissions',
  BEACON_SDK_VERSION = 'beacon:sdk_version',
  MATRIX_PRESERVED_STATE = 'beacon:sdk-matrix-preserved-state',
  MATRIX_PEER_ROOM_IDS = 'beacon:matrix-peer-rooms',
  MATRIX_SELECTED_NODE = 'beacon:matrix-selected-node',
  MULTI_NODE_SETUP_DONE = 'beacon:multi-node-setup'
}
