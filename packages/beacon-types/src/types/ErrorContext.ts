import { BeaconErrorType } from './BeaconErrorType'
import { TransportType } from './transport/TransportType'

/**
 * Snapshot of diagnostic information for error reporting
 */
export interface DiagnosticSnapshot {
  /**
   * SDK version
   */
  sdkVersion: string

  /**
   * Transport type being used
   */
  transport?: TransportType

  /**
   * Active account identifier
   */
  activeAccount?: string

  /**
   * Last selected wallet
   */
  lastSelectedWallet?: string

  /**
   * WalletConnect session state (if applicable)
   */
  walletConnectSession?: {
    topic?: string
    expiry?: number
    accounts?: string[]
    networks?: string[]
    permissions?: string[]
  }

  /**
   * Number of connected accounts
   */
  accountCount?: number

  /**
   * Number of paired peers
   */
  peerCount?: number

  /**
   * Additional storage data (filtered for privacy)
   */
  storage?: Record<string, unknown>
}

/**
 * Complete error context for debugging and support
 */
export interface ErrorContext {
  /**
   * Unique error code identifier (e.g., "WC_SESSION_EXPIRED")
   */
  errorCode: string

  /**
   * Beacon error type enum
   */
  errorType: BeaconErrorType

  /**
   * User-facing error message
   */
  message: string

  /**
   * Technical details for developers
   */
  technicalDetails?: string

  /**
   * Additional error-specific data
   */
  errorData?: unknown

  /**
   * Unix timestamp when error occurred
   */
  timestamp: number

  /**
   * Diagnostic information snapshot
   */
  diagnostics: DiagnosticSnapshot
}
