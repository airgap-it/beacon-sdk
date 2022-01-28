/*

TODO: This is a duplicated file during development. Remove before release

*/

import {
  AccountInfo,
  AppMetadata,
  BeaconMessageType,
  ConnectionContext
} from '@airgap/beacon-types'

interface ResponseInput {
  request: BlockchainMessage
  account: AccountInfo
  output: BeaconMessageWrapper<BeaconBaseMessage>
  blockExplorer: any
  connectionContext: ConnectionContext
  walletInfo: any // WalletInfo
}

export interface Blockchain {
  readonly identifier: string
  validateRequest(input: BlockchainMessage): Promise<void>
  handleResponse(input: ResponseInput): Promise<void>

  getAddressFromPermissionResponse(permissionResponse: PermissionResponseV3): Promise<string>
}

export class TezosBlockchain implements Blockchain {
  public readonly identifier: string = 'xtz'
  async validateRequest(input: BlockchainMessage): Promise<void> {
    // TODO: Validation
    if (input) {
      return
    }
  }
  async handleResponse(input: ResponseInput): Promise<void> {
    // TODO: Validation
    if (input) {
      return
    }
  }

  async getAddressFromPermissionResponse(
    _permissionResponse: PermissionResponseV3<'tezos'>
  ): Promise<string> {
    return '' // getAddressFromPublicKey(permissionResponse.publicKey)
  }
}

export class SubstrateBlockchain implements Blockchain {
  async validateRequest(input: BlockchainMessage): Promise<void> {
    // TODO: Validation
    if (input) {
      return
    }
  }
  async handleResponse(input: ResponseInput): Promise<void> {
    // TODO: Validation
    if (input) {
      return
    }
  }

  public readonly identifier: string = 'substrate'
  async getAddressFromPermissionResponse(
    permissionResponse: SubstratePermissionResponse
  ): Promise<string> {
    return `${permissionResponse.blockchainData.accounts}`
  }
}

export interface BeaconMessageWrapper<T extends BeaconBaseMessage> {
  id: string // ID of the message. The same ID is used in the request and response
  version: string
  senderId: string // ID of the sender. This is used to identify the
  message: T
}

export interface BeaconBaseMessage {
  type: unknown
}

export interface BlockchainMessage<T extends string = string> {
  blockchainIdentifier: T
  type: unknown
  blockchainData: unknown
}

export interface PermissionRequestV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.PermissionRequest
  blockchainData: {
    appMetadata: AppMetadata // Some additional information about the DApp
    scopes: number[]
  }
}
export interface PermissionResponseV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.PermissionResponse
  accountId: string
  blockchainData: {
    appMetadata: AppMetadata // Some additional information about the Wallet
    scopes: number[] // Permissions that have been granted for this specific address / account
  }
}

export interface BlockchainRequestV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.BlockchainRequest
  accountId: string
  blockchainData: {
    type: string
    scope: number
  }
}

export interface BlockchainResponseV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.BlockchainResponse
  // accountId is not present, because it can be fetched from the request
  blockchainData: unknown
}

// Error (Blockchain)
export interface BlockchainErrorResponse<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.Error
  error: {
    type: unknown
    data?: unknown
  }
  description?: string
}

// Acknowledge
export interface AcknowledgeMessage extends BeaconBaseMessage {
  type: BeaconMessageType.Acknowledge
}

// Disconnect
export interface DisconnectMessage extends BeaconBaseMessage {
  type: BeaconMessageType.Disconnect
}

export interface SubstrateNetwork {
  genesisHash: string // Wallet shows only those accounts
  rpc?: string // For development nodes?
}

// Those are example permissions
export enum SubstratePermissionScope {
  TRANSFER = 0,
  SIGN_RAW = 1,
  SIGN_STRING = 2
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
