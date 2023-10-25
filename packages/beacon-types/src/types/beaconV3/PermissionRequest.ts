import {
  AccountInfo,
  AppMetadata,
  BeaconMessageType,
  ConnectionContext,
  WalletInfo,
  ExtensionApp,
  DesktopApp,
  WebApp,
  App
} from '@mavrykdynamics/beacon-types'

export interface ResponseInput {
  request: BlockchainMessage
  account: AccountInfo
  output: BeaconMessageWrapper<BeaconBaseMessage>
  blockExplorer: any
  connectionContext: ConnectionContext
  walletInfo: WalletInfo
}

export interface Blockchain {
  readonly identifier: string
  validateRequest(input: BlockchainMessage): Promise<void>
  handleResponse(input: ResponseInput): Promise<void>

  getWalletLists(): Promise<{
    extensionList: ExtensionApp[]
    desktopList: DesktopApp[]
    webList: WebApp[]
    iOSList: App[]
  }>

  getAccountInfosFromPermissionResponse(
    permissionResponse: PermissionResponseV3
  ): Promise<{ accountId: string; address: string; publicKey: string }[]>
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
    scopes: string[]
  }
}
export interface PermissionResponseV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.PermissionResponse
  blockchainData: {
    appMetadata: AppMetadata // Some additional information about the Wallet
    scopes: string[] // Permissions that have been granted for this specific address / account
  }
}

export interface BlockchainRequestV3<T extends string = string> extends BlockchainMessage<T> {
  blockchainIdentifier: T
  type: BeaconMessageType.BlockchainRequest
  accountId: string
  blockchainData: {
    type: string
    scope: string
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
