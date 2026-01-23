/**
 * Beacon Protocol Types
 *
 * UI-friendly types for the Beacon V2 protocol.
 */

import type { PermissionScope, SigningType } from '@airgap/beacon-types'

export interface NetworkConfig {
  type: string
  rpcUrl?: string
  name?: string
}

export interface UIPermissionRequest {
  id: string
  type: 'permission'
  appName: string
  appIcon?: string
  scopes: PermissionScope[]
  network?: NetworkConfig
}

export interface UISignRequest {
  id: string
  type: 'sign'
  appName: string
  appIcon?: string
  payload: string
  signingType: SigningType
}

export interface UIOperationRequest {
  id: string
  type: 'operation'
  appName: string
  appIcon?: string
  operations: TezosOperation[]
  network: NetworkConfig
}

export type UIRequest = UIPermissionRequest | UISignRequest | UIOperationRequest

export interface TezosOperation {
  kind: string
  source?: string
  destination?: string
  amount?: string
  fee?: string
  gas_limit?: string
  storage_limit?: string
  parameters?: unknown
  delegate?: string
  public_key?: string
  balance?: string
  script?: {
    code: unknown
    storage: unknown
  }
}

export const MessageTypes = {
  // Content script -> Background
  BEACON_MESSAGE: 'BEACON_MESSAGE',

  // Background -> Content script
  BEACON_RESPONSE: 'BEACON_RESPONSE',

  // Background <-> Popup
  GET_PENDING_REQUEST: 'GET_PENDING_REQUEST',
  PENDING_REQUEST: 'PENDING_REQUEST',
  APPROVE_REQUEST: 'APPROVE_REQUEST',
  REJECT_REQUEST: 'REJECT_REQUEST',

  // Wallet state
  GET_WALLET_STATE: 'GET_WALLET_STATE',
  WALLET_STATE: 'WALLET_STATE',
  INIT_WALLET: 'INIT_WALLET',
  WALLET_INITIALIZED: 'WALLET_INITIALIZED',
  SET_NETWORK: 'SET_NETWORK'
} as const

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes]

export interface ExtensionMessage {
  type: MessageType
  payload?: unknown
}

export interface WalletState {
  isReady: boolean
  address: string | null
  publicKey: string | null
  balance: string | null
  network: NetworkConfig | null
}

export interface PendingRequest {
  id: string
  request: UIRequest
  rawRequest: unknown // BeaconRequest from BeaconMessageFormatter
  tabId: number
  timestamp: number
  peerPublicKey?: string // Peer's public key for response encryption (PostMessage transport)
}
