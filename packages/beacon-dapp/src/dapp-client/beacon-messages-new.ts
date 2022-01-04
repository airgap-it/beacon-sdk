import { WalletInfo } from 'src/events'
import {
  AccountInfo,
  AppMetadata,
  BlockExplorer,
  BeaconErrorType,
  BeaconMessageType,
  ConnectionContext
} from '../'

interface ResponseInput {
  request: BlockchainMessage
  account: AccountInfo
  output: BeaconMessageWrapper<BeaconBaseMessage>
  blockExplorer: BlockExplorer
  connectionContext: ConnectionContext
  walletInfo: WalletInfo
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
    return `${permissionResponse.chainData.accounts}`
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
  chainData: unknown
}

export interface PermissionRequestV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.PermissionRequest
  chainData: {
    appMetadata: AppMetadata // Some additional information about the DApp
    scopes: number[]
  }
}
export interface PermissionResponseV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.PermissionResponse
  accountId: string
  chainData: {
    appMetadata: AppMetadata // Some additional information about the Wallet
    scopes: number[] // Permissions that have been granted for this specific address / account
  }
}

export interface BlockchainRequestV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: unknown
  scope: unknown
  accountId: string
  chainData: unknown
}

export interface BlockchainResponseV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: unknown
  accountId: string
  chainData: unknown
}

// Error (Blockchain)
export interface BlockchainErrorResponse<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.Error
  errorType: unknown
  errorData: unknown
}

// Error (Generic)
export interface ErrorResponse extends BeaconBaseMessage {
  type: BeaconMessageType.Error
  errorType: BeaconErrorType
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
  chainData: {
    appMetadata: AppMetadata
    scopes: SubstratePermissionScope[]
    network?: SubstrateNetwork[] // Array to "whitelist" certain networks
  }
}
export interface SubstratePermissionResponse extends PermissionResponseV3<'substrate'> {
  chainData: {
    appMetadata: AppMetadata
    scopes: SubstratePermissionScope[]
    accounts: {
      network: SubstrateNetwork
      addressPrefix: number
      publicKey: string
      // Replace with address?
      // Prefer address, but ask if we can verify signatures with addresses with other curves
    }[]
  }
}

export interface SubstrateTransferRequest extends BlockchainRequestV3<'substrate'> {
  chainData: {
    scope: SubstratePermissionScope.TRANSFER
    sourceAddress: string
    amount: string
    recipient: string
    network: SubstrateNetwork
    mode: 'broadcast' | 'broadcast-and-return' | 'return' // TODO: Wording
  }
}
export interface SubstrateTransferResponse extends BlockchainRequestV3<'substrate'> {
  chainData:
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
  accountId: string // Used to match account
  // Is the Wallet allowed to alter this request (eg. tip?). If yes, payload needs to be sent back
  metadata: {
    genesisHash: string // Do we need this?
    runtimeVersion: string // Wallet should check if it's the latest version
    transactionVersion: string
  }
  payload: string // SCALE encoded payload
  mode: 'broadcast' | 'broadcast-and-return' | 'return' // TODO: Wording
}
export interface SubstrateSignResponse extends BlockchainRequestV3<'substrate'> {
  chainData:
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
