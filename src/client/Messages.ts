export type PermissionScope = 'read_address' | 'sign' | 'payment_request' | 'threshold'

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

export interface PermissionRequest {
  id: string
  type: MessageTypes.PermissionRequest
  scope: PermissionScope[]
}

export type PermissionResponse = {
  id: string
  type: MessageTypes.PermissionResponse
  address: string
  networks: string[]
  permissions: PermissionScope[]
}[]

export interface SignPayloadRequest {
  // TODO: ID?
  id: string
  type: MessageTypes.SignPayloadRequest
  payload: Buffer[]
  sourceAddress: string
}

export interface SignPayloadResponse {
  // TODO: No payload / ID?
  id: string
  type: MessageTypes.SignPayloadResponse

  signature: Buffer[]
}

export interface OperationRequest {
  id: string
  type: MessageTypes.OperationRequest

  network: string
  recipient: string
  amount: string
  source?: string
}

export interface OperationResponse {
  id: string
  type: MessageTypes.OperationResponse

  transactionHash: string
}
// BROADCAST_ERROR: Should the signed tx be returned?

export interface BroadcastRequest {
  id: string
  type: MessageTypes.BroadcastRequest

  network: string
  signedTransaction: Buffer[]
}

export interface BroadcastResponse {
  id: string
  type: MessageTypes.BroadcastResponse

  transactionHash: string
}
