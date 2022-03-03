import { AppMetadata, BlockchainMessage, PermissionResponseV3 } from '@airgap/beacon-types'

export interface NewPermissionRequest<T extends string> {
  blockchainIdentifier: T
}

// Those are example permissions
export enum SubstratePermissionScope {
  'transfer',
  'sign_payload',
  'sign_raw'
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

export interface SubstrateTransferRequest extends BlockchainMessage<'substrate'> {
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
      signature: string
      payload: string
    }
  | {
      signature: string
      payload: string
    }

export interface SubstrateSignPayloadRequest extends BlockchainMessage<'substrate'> {
  blockchainData: {
    scope: SubstratePermissionScope.sign_payload
    mode: 'broadcast' | 'broadcast-and-return' | 'return' // TODO: Wording

    // This type is the same as the "SignerPayloadJSON" of polkadot.js https://github.com/polkadot-js/api/blob/f169ca08a80ea9c3865dc545e03e921c50f0d284/packages/types/src/types/extrinsic.ts#L32
    data: {
      scope: SubstratePermissionScope.sign_payload

      /**
       * @description The ss-58 encoded address
       */
      address: string

      /**
       * @description The checkpoint hash of the block, in hex
       */
      blockHash: string

      /**
       * @description The checkpoint block number, in hex
       */
      blockNumber: string

      /**
       * @description The era for this transaction, in hex
       */
      era: string

      /**
       * @description The genesis hash of the chain, in hex
       */
      genesisHash: string

      /**
       * @description The encoded method (with arguments) in hex
       */
      method: string

      /**
       * @description The nonce for this transaction, in hex
       */
      nonce: string

      /**
       * @description The current spec version for the runtime
       */
      specVersion: string

      /**
       * @description The tip for this transaction, in hex
       */
      tip: string

      /**
       * @description The current transaction version for the runtime
       */
      transactionVersion: string

      /**
       * @description The applicable signed extensions for this runtime
       */
      signedExtensions: string[]

      /**
       * @description The version of the extrinsic we are dealing with
       */
      version: number
    }
  }
}
export type SubstrateSignPayloadResponse =
  | {
      transactionHash: string
    }
  | {
      transactionHash: string
      signature: string
      payload: string
    }
  | {
      signature: string
      payload: string
    }

export interface SubstrateSignRequest extends BlockchainMessage<'substrate'> {
  blockchainData: {
    scope: SubstratePermissionScope.sign_raw
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
