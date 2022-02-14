import { AppMetadata, BlockchainMessage, PermissionResponseV3 } from '@airgap/beacon-types'

export interface NewPermissionRequest<T extends string> {
  blockchainIdentifier: T
}

// Those are example permissions
export enum SubstratePermissionScope {
  'signRaw',
  'signString',
  'transfer'
}

export interface SubstratePermissionRequest extends NewPermissionRequest<'substrate'> {
  blockchainData: {
    scopes?: string[] // enum
    network?: {
      genesisHash: string // Wallet shows only those accounts
      rpc?: string // For development nodes?
    }[] // Array to "whitelist" certain networks? (optional)
  }
}
export interface SubstratePermissionResponse extends PermissionResponseV3<'substrate'> {
  blockchainData: {
    appMetadata: AppMetadata
    scopes: string[] // enum
    accounts: {
      network: {
        genesisHash: string
        rpc?: string
      }
      addressPrefix: number
      publicKey: string
      // Replace with address?
      // Prefer address, but ask if we can verify signatures with addresses with other curves
    }[]
  }
}

export interface SubstrateTransferReq extends BlockchainMessage<'substrate'> {
  blockchainData: {
    scope: SubstratePermissionScope.transfer
    sourceAddress: string
    amount: string
    recipient: string
    network: {
      genesisHash: string
      rpc?: string
    }
    mode: 'broadcast' | 'broadcast-and-return' | 'return' // TODO: Wording
  }
}
export type SubstrateTransferResponse =
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

export interface SubstrateSignRequest extends BlockchainMessage<'substrate'> {
  blockchainData: {
    scope: SubstratePermissionScope.signString | SubstratePermissionScope.signRaw
    address: string // Used to match account
    // Is the Wallet allowed to alter this request (eg. tip?). If yes, payload needs to be sent back
    metadata: {
      genesisHash: string // Do we need this?
      runtimeVersion: string // Wallet should check if it's the latest version
      transactionVersion: string
    }
    payload: string // SCALE encoded payload
    mode: 'broadcast' | 'broadcast-and-return' | 'return' // TODO: Wording
  }
}
export interface SubstrateSignResponse {
  signature: string
  payload?: string
}
