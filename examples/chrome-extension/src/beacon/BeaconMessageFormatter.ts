// Converts Beacon V2 protocol messages to/from UI-friendly formats

import {
  BeaconMessageType,
  BeaconErrorType,
  type PermissionRequest,
  type PermissionRequestOutput,
  type SignPayloadRequest,
  type SignPayloadRequestOutput,
  type OperationRequest,
  type OperationRequestOutput,
  type PermissionScope,
  SigningType
} from '@airgap/beacon-types'

import type {
  UIRequest,
  UIPermissionRequest,
  UISignRequest,
  UIOperationRequest,
  NetworkConfig,
  TezosOperation
} from './types'

// V2 beacon request types
export type BeaconRequest =
  | PermissionRequest
  | PermissionRequestOutput
  | SignPayloadRequest
  | SignPayloadRequestOutput
  | OperationRequest
  | OperationRequestOutput

function getMessageType(message: BeaconRequest): BeaconMessageType {
  return message.type
}

function isPermissionRequest(message: BeaconRequest): boolean {
  return getMessageType(message) === BeaconMessageType.PermissionRequest
}

function isSignRequest(message: BeaconRequest): boolean {
  return getMessageType(message) === BeaconMessageType.SignPayloadRequest
}

function isOperationRequest(message: BeaconRequest): boolean {
  return getMessageType(message) === BeaconMessageType.OperationRequest
}

export function toUIFormat(message: BeaconRequest): UIRequest {
  if (isPermissionRequest(message)) {
    return toUIPermissionRequest(message as PermissionRequest | PermissionRequestOutput)
  }
  if (isSignRequest(message)) {
    return toUISignRequest(message as SignPayloadRequestOutput)
  }
  if (isOperationRequest(message)) {
    return toUIOperationRequest(message as OperationRequestOutput)
  }

  throw new Error(`Unknown request type: ${getMessageType(message)}`)
}

function toUIPermissionRequest(message: PermissionRequest | PermissionRequestOutput): UIPermissionRequest {
  return {
    id: message.id,
    type: 'permission',
    appName: message.appMetadata?.name || 'Unknown App',
    appIcon: message.appMetadata?.icon,
    scopes: message.scopes || [],
    network: message.network ? { type: message.network.type, rpcUrl: message.network.rpcUrl } : undefined
  }
}

function toUISignRequest(message: SignPayloadRequestOutput): UISignRequest {
  return {
    id: message.id,
    type: 'sign',
    appName: message.appMetadata?.name || 'Unknown App',
    appIcon: message.appMetadata?.icon,
    payload: message.payload || '',
    signingType: message.signingType || SigningType.RAW
  }
}

function toUIOperationRequest(message: OperationRequestOutput): UIOperationRequest {
  return {
    id: message.id,
    type: 'operation',
    appName: message.appMetadata?.name || 'Unknown App',
    appIcon: message.appMetadata?.icon,
    operations: (message.operationDetails as TezosOperation[]) || [],
    network: {
      type: message.network?.type || 'mainnet',
      rpcUrl: message.network?.rpcUrl
    }
  }
}

export interface WalletMetadata {
  senderId: string
  name: string
  icon?: string
}

export function toBeaconPermissionResponse(
  request: BeaconRequest,
  approval: {
    address: string
    publicKey: string
    network: NetworkConfig
    scopes: PermissionScope[]
  },
  _wallet: WalletMetadata
): unknown {
  return {
    id: request.id,
    type: BeaconMessageType.PermissionResponse,
    publicKey: approval.publicKey,
    network: {
      type: approval.network.type,
      rpcUrl: approval.network.rpcUrl
    },
    scopes: approval.scopes
  }
}

export function toBeaconSignResponse(
  request: BeaconRequest,
  result: { signature: string },
  _wallet: WalletMetadata
): unknown {
  const v2 = request as SignPayloadRequest
  return {
    id: request.id,
    type: BeaconMessageType.SignPayloadResponse,
    signingType: v2.signingType || SigningType.RAW,
    signature: result.signature
  }
}

export function toBeaconOperationResponse(
  request: BeaconRequest,
  result: { opHash: string },
  _wallet: WalletMetadata
): unknown {
  return {
    id: request.id,
    type: BeaconMessageType.OperationResponse,
    transactionHash: result.opHash
  }
}

export function toBeaconError(
  request: BeaconRequest,
  errorType: BeaconErrorType,
  _walletSenderId: string,
  errorData?: unknown
): unknown {
  return {
    id: request.id,
    type: BeaconMessageType.Error,
    errorType,
    ...(errorData ? { errorData } : {})
  }
}
