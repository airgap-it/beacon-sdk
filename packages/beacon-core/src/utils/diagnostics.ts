import {
  Storage,
  StorageKey,
  DiagnosticSnapshot,
  ErrorContext,
  BeaconErrorType,
  TransportType
} from '@airgap/beacon-types'

import packageJson from '../../package.json'
import { BeaconError } from '../errors/BeaconError'

/**
 * Storage keys that contain sensitive information and should be filtered out
 */
export const SENSITIVE_STORAGE_KEYS: StorageKey[] = [
  StorageKey.BEACON_SDK_SECRET_SEED,
  StorageKey.WC_2_CORE_KEYCHAIN,
  StorageKey.PUSH_TOKENS
]

/**
 * Gathers diagnostic information from storage for error reporting.
 * Automatically filters sensitive keys for privacy.
 *
 * @param storage - The storage instance to read from
 * @param transport - Optional transport type being used
 * @returns Promise resolving to diagnostic snapshot
 */
export async function gatherDiagnostics(
  storage: Storage,
  transport?: TransportType
): Promise<DiagnosticSnapshot> {
  try {
    // Get SDK version
    const sdkVersion = packageJson.version

    // Get active account
    const activeAccountValue = await storage.get(StorageKey.ACTIVE_ACCOUNT)
    const activeAccount =
      typeof activeAccountValue === 'string'
        ? activeAccountValue
        : activeAccountValue && typeof activeAccountValue === 'object'
          ? (activeAccountValue as { accountIdentifier?: string; address?: string }).accountIdentifier ??
            (activeAccountValue as { address?: string }).address
          : undefined

    // Get last selected wallet
    const lastSelectedWalletValue = await storage.get(StorageKey.LAST_SELECTED_WALLET)
    const lastSelectedWallet =
      lastSelectedWalletValue && typeof lastSelectedWalletValue === 'object'
        ? (lastSelectedWalletValue as { name?: string; key?: string }).name ??
          (lastSelectedWalletValue as { key?: string }).key
        : typeof lastSelectedWalletValue === 'string'
          ? lastSelectedWalletValue
          : undefined

    // Get accounts count
    const accounts = await storage.get(StorageKey.ACCOUNTS)
    const accountCount = Array.isArray(accounts) ? accounts.length : 0

    // Get peers count (try different storage keys based on transport)
    let peerCount = 0
    try {
      const p2pPeers = await storage.get(StorageKey.TRANSPORT_P2P_PEERS_DAPP)
      const wcPeers = await storage.get(StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP)
      const pmPeers = await storage.get(StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP)

      peerCount =
        (Array.isArray(p2pPeers) ? p2pPeers.length : 0) +
        (Array.isArray(wcPeers) ? wcPeers.length : 0) +
        (Array.isArray(pmPeers) ? pmPeers.length : 0)
    } catch {
      // Ignore peer count errors
    }

    // Get WalletConnect session info if applicable
    let walletConnectSession: DiagnosticSnapshot['walletConnectSession'] | undefined
    if (transport === TransportType.WALLETCONNECT) {
      try {
        const wcSession = await storage.get(StorageKey.WC_2_CLIENT_SESSION)
        if (wcSession && typeof wcSession === 'object') {
          const sessionData = wcSession as Record<string, unknown>
          // Extract relevant session info safely
          walletConnectSession = {
            topic: typeof sessionData.topic === 'string' ? sessionData.topic : undefined,
            expiry: typeof sessionData.expiry === 'number' ? sessionData.expiry : undefined,
            accounts:
              Array.isArray(sessionData.accounts) && sessionData.accounts.every((a) => typeof a === 'string')
                ? (sessionData.accounts as string[])
                : undefined,
            networks: undefined, // Would need to extract from namespaces
            permissions: undefined // Would need to extract from namespaces
          }
        }
      } catch {
        // Ignore WC session errors
      }
    }

    // Gather additional non-sensitive storage data
    const storageData: Record<string, unknown> = {}
    const keysToInclude: StorageKey[] = [
      StorageKey.BEACON_SDK_VERSION,
      StorageKey.WC_INIT_ERROR,
      StorageKey.MATRIX_SELECTED_NODE,
      StorageKey.PERMISSION_LIST
    ]

    for (const key of keysToInclude) {
      try {
        const value = await storage.get(key)
        if (value !== undefined) {
          storageData[key] = value
        }
      } catch {
        // Ignore individual key errors
      }
    }

    return {
      sdkVersion,
      transport,
      activeAccount,
      lastSelectedWallet,
      walletConnectSession,
      accountCount,
      peerCount,
      storage: Object.keys(storageData).length > 0 ? storageData : undefined
    }
  } catch (error) {
    // If diagnostic gathering fails, return minimal info
    return {
      sdkVersion: packageJson.version,
      transport
    }
  }
}

/**
 * Builds a complete error context from an error and storage state.
 *
 * @param error - The BeaconError or Error instance
 * @param storage - The storage instance to read diagnostic data from
 * @param transport - Optional transport type being used
 * @returns Promise resolving to complete error context
 */
export async function buildErrorContext(
  error: BeaconError | Error,
  storage: Storage,
  transport?: TransportType
): Promise<ErrorContext> {
  const diagnostics = await gatherDiagnostics(storage, transport)

  // If it's a BeaconError, we have structured information
  if (error instanceof BeaconError) {
    const errorData = (error as unknown as { data?: unknown }).data
    // Prefer transport-specific error code from errorData if available
    const errorCode = (errorData && typeof errorData === 'object' && 'errorCode' in errorData && typeof errorData.errorCode === 'string')
      ? errorData.errorCode
      : error.code

    return {
      errorCode,
      errorType: error.type,
      message: error.title || error.message,
      technicalDetails: error.description,
      errorData,
      timestamp: Date.now(),
      diagnostics
    }
  }

  // For generic errors, create basic context
  return {
    errorCode: 'UNKNOWN_ERROR',
    errorType: BeaconErrorType.UNKNOWN_ERROR,
    message: error.message || 'An unknown error occurred',
    timestamp: Date.now(),
    diagnostics
  }
}

/**
 * Serializes error context to formatted JSON string for copying.
 *
 * @param errorContext - The error context to serialize
 * @returns Formatted JSON string
 */
export function serializeErrorContext(errorContext: ErrorContext): string {
  return JSON.stringify(errorContext, null, 2)
}

/**
 * Copies error context to clipboard (browser only).
 *
 * @param errorContext - The error context to copy
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function copyErrorContextToClipboard(errorContext: ErrorContext): Promise<boolean> {
  try {
    const jsonString = serializeErrorContext(errorContext)

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(jsonString)
      return true
    }

    return false
  } catch {
    return false
  }
}
