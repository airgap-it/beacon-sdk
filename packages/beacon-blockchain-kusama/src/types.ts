import {
  AppMetadata,
  BlockchainRequestV3,
  BlockchainResponseV3,
  PermissionRequestV3,
  PermissionResponseV3
} from '@airgap/beacon-types'

export interface SubstrateNetwork {
  genesisHash: string // Wallet shows only those accounts
  rpc?: string // For development nodes?
}

// Those are example permissions
export enum SubstratePermissionScope {
  TRANSFER = 'transfer',
  SIGN_RAW = 'sign_raw',
  SIGN_STRING = 'sign_string'
}

export interface SubstratePermissionRequest extends PermissionRequestV3<'substrate'> {
  blockchainData: {
    appMetadata: AppMetadata
    scopes: SubstratePermissionScope[]
    networks?: SubstrateNetwork[] // Array to "whitelist" certain networks
  }
}
export interface SubstratePermissionResponse extends PermissionResponseV3<'substrate'> {
  blockchainData: {
    appMetadata: AppMetadata
    scopes: SubstratePermissionScope[]
    accounts: {
      network: SubstrateNetwork
      addressPrefix: number
      publicKey: string
      // should we add a curve type here?
    }[]
  }
}

export interface SubstrateTransferRequest extends BlockchainRequestV3<'substrate'> {
  blockchainData: {
    type: ''
    scope: SubstratePermissionScope.TRANSFER
    sourceAddress: string
    amount: string
    recipient: string
    network: SubstrateNetwork
    mode: 'broadcast' | 'broadcast-and-return' | 'return' // TODO: Wording
  }
}
export interface SubstrateTransferResponse extends BlockchainResponseV3<'substrate'> {
  blockchainData:
    | {
        transactionHash: string
      }
    | {
        transactionHash: string
        payload: string
      }
    | {
        payload: string
      }
}

export interface SubstrateSignRequest extends BlockchainRequestV3<'substrate'> {
  scope: SubstratePermissionScope.SIGN_STRING | SubstratePermissionScope.SIGN_RAW
  // Is the Wallet allowed to alter this request (eg. tip?). If yes, payload needs to be sent back
  network: SubstrateNetwork
  runtimeSpec: {
    runtimeVersion: string // Wallet should check if it's the latest version
    transactionVersion: string
  }
  payload: string // SCALE encoded payload
  mode: 'broadcast' | 'broadcast-and-return' | 'return' // TODO: Wording
}

export interface SubstrateSignResponse extends BlockchainResponseV3<'substrate'> {
  blockchainData:
    | {
        signature: string
      }
    | {
        signature: string
        payload: string
      }
    | {
        payload: string
      }
}
