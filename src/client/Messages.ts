import { TezosOperation } from './operations/OperationTypes'

export type PermissionScope = 'read_address' | 'sign' | 'operation_request' | 'threshold'

export enum MessageTypes {
  PermissionRequest = 'permission_request',
  SignPayloadRequest = 'sign_payload_request',
  OperationRequest = 'operation_request',
  BroadcastRequest = 'broadcast_request',
  PermissionResponse = 'permission_response',
  SignPayloadResponse = 'sign_payload_response',
  OperationResponse = 'operation_response',
  BroadcastResponse = 'broadcast_response'
}

export type Messages =
  | PermissionRequest
  | PermissionResponse
  | SignPayloadRequest
  | SignPayloadResponse
  | OperationRequest
  | OperationResponse
  | BroadcastRequest
  | BroadcastResponse

export interface BaseMessage {
  id: string
  type: MessageTypes
}

export interface PermissionRequest extends BaseMessage {
  type: MessageTypes.PermissionRequest
  name: string
  scope: PermissionScope[]
}

export interface PermissionResponse extends BaseMessage {
  type: MessageTypes.PermissionResponse
  permissions: {
    pubkey: string
    networks: string[]
    scopes: PermissionScope[]
  }
}

export interface SignPayloadRequest extends BaseMessage {
  type: MessageTypes.SignPayloadRequest
  payload: Buffer[]
  sourceAddress: string
}

export interface SignPayloadResponse extends BaseMessage {
  type: MessageTypes.SignPayloadResponse

  signature: Buffer[]
}

export interface OperationRequest extends BaseMessage {
  type: MessageTypes.OperationRequest

  network: string
  operationDetails: TezosOperation
}

export interface OperationResponse extends BaseMessage {
  type: MessageTypes.OperationResponse

  transactionHash: string
}

export interface BroadcastRequest extends BaseMessage {
  type: MessageTypes.BroadcastRequest

  network: string
  signedTransaction: Buffer[]
}

export interface BroadcastResponse extends BaseMessage {
  type: MessageTypes.BroadcastResponse

  transactionHash: string
}
