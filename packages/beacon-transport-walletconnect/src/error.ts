import { BeaconErrorType } from '@airgap/beacon-types'

import { PermissionScopeMethods } from './communication-client/WalletConnectCommunicationClient'

/**
 * Lookup table for official WalletConnect error codes
 * Reference: @walletconnect/utils SDK_ERRORS and INTERNAL_ERRORS
 */
const WC_CODE_TO_ERROR_MAP: Record<number, { code: string; type: BeaconErrorType }> = {
  // INTERNAL_ERRORS (from @walletconnect/utils)
  1: { code: 'WC_NOT_INITIALIZED', type: BeaconErrorType.UNKNOWN_ERROR },
  2: { code: 'WC_NO_MATCHING_KEY', type: BeaconErrorType.UNKNOWN_ERROR },
  6: { code: 'WC_EXPIRED', type: BeaconErrorType.UNKNOWN_ERROR },
  7: { code: 'WC_UNKNOWN_TYPE', type: BeaconErrorType.UNKNOWN_ERROR },
  8: { code: 'WC_MISMATCHED_TOPIC', type: BeaconErrorType.UNKNOWN_ERROR },
  9: { code: 'WC_NON_CONFORMING_NAMESPACES', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },

  // SDK_ERRORS - INVALID (1xxx)
  1001: { code: 'WC_INVALID_METHOD', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },
  1002: { code: 'WC_INVALID_EVENT', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },
  1003: { code: 'WC_INVALID_UPDATE_REQUEST', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },
  1004: { code: 'WC_INVALID_EXTEND_REQUEST', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },
  1005: { code: 'WC_INVALID_SESSION_SETTLE_REQUEST', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },

  // SDK_ERRORS - UNAUTHORIZED (3xxx)
  3001: { code: 'WC_UNAUTHORIZED_METHOD', type: BeaconErrorType.NOT_GRANTED_ERROR },
  3002: { code: 'WC_UNAUTHORIZED_EVENT', type: BeaconErrorType.NOT_GRANTED_ERROR },
  3003: { code: 'WC_UNAUTHORIZED_UPDATE_REQUEST', type: BeaconErrorType.NOT_GRANTED_ERROR },
  3004: { code: 'WC_UNAUTHORIZED_EXTEND_REQUEST', type: BeaconErrorType.NOT_GRANTED_ERROR },

  // SDK_ERRORS - USER_REJECTED (5xxx)
  5000: { code: 'WC_USER_REJECTED', type: BeaconErrorType.ABORTED_ERROR },
  5001: { code: 'WC_USER_REJECTED_CHAINS', type: BeaconErrorType.ABORTED_ERROR },
  5002: { code: 'WC_USER_REJECTED_METHODS', type: BeaconErrorType.ABORTED_ERROR },
  5003: { code: 'WC_USER_REJECTED_EVENTS', type: BeaconErrorType.ABORTED_ERROR },

  // SDK_ERRORS - UNSUPPORTED (51xx)
  5100: { code: 'WC_UNSUPPORTED_CHAINS', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },
  5101: { code: 'WC_UNSUPPORTED_METHODS', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },
  5102: { code: 'WC_UNSUPPORTED_EVENTS', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },
  5103: { code: 'WC_UNSUPPORTED_ACCOUNTS', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },
  5104: { code: 'WC_UNSUPPORTED_NAMESPACE_KEY', type: BeaconErrorType.PARAMETERS_INVALID_ERROR },

  // SDK_ERRORS - REASON (6xxx)
  6000: { code: 'WC_USER_DISCONNECTED', type: BeaconErrorType.ABORTED_ERROR },

  // SDK_ERRORS - FAILURE (7xxx)
  7000: { code: 'WC_SESSION_SETTLEMENT_FAILED', type: BeaconErrorType.UNKNOWN_ERROR },

  // PAIRING (10xxx)
  10001: { code: 'WC_METHOD_UNSUPPORTED', type: BeaconErrorType.PARAMETERS_INVALID_ERROR }
}

/**
 * Maps WalletConnect errors to BeaconErrorType and error codes.
 * Uses official WalletConnect error codes when available.
 * Reference: @walletconnect/utils SDK_ERRORS and INTERNAL_ERRORS
 */
export function mapWCErrorToBeaconError(error: Error): {
  errorType: BeaconErrorType
  errorCode: string
  errorData?: unknown
} {
  const wcError = error as Error & { code?: number; data?: unknown }

  // Check WC error code first (official WalletConnect errors)
  if (typeof wcError.code === 'number' && WC_CODE_TO_ERROR_MAP[wcError.code]) {
    const mapping = WC_CODE_TO_ERROR_MAP[wcError.code]
    return {
      errorType: mapping.type,
      errorCode: mapping.code,
      errorData: { message: error.message, code: wcError.code }
    }
  }

  // Check for custom Beacon SDK WC error classes (have errorCode and beaconErrorType properties)
  const customWCError = error as Error & { errorCode?: string; beaconErrorType?: BeaconErrorType }
  if (customWCError.errorCode && customWCError.beaconErrorType) {
    // Build errorData based on specific error properties
    let errorData: any = { message: error.message }

    if (error instanceof InvalidReceivedSessionNamespace) {
      errorData = { message: error.message, data: error.data, codeWc: error.codeWc }
    } else if (error instanceof MissingRequiredScope) {
      errorData = { message: error.message, requiredScopes: error.requiredScopes }
    } else if (error instanceof InvalidNetworkOrAccount) {
      errorData = { message: error.message, network: error.network, pkh: error.pkh }
    }

    return {
      errorType: customWCError.beaconErrorType,
      errorCode: customWCError.errorCode,
      errorData
    }
  }

  // Default: unknown WC error - display whatever message we have
  return {
    errorType: BeaconErrorType.UNKNOWN_ERROR,
    errorCode: 'WC_UNKNOWN_ERROR',
    errorData: { message: error.message, code: wcError.code }
  }
}

/**
 *  @category Error
 *  @description Error that indicates the wallet returned an invalid namespace
 */
export class InvalidReceivedSessionNamespace extends Error {
  name = 'InvalidReceivedSessionNamespace'
  beaconErrorType = BeaconErrorType.PARAMETERS_INVALID_ERROR

  constructor(
    public messageWc: string,
    public codeWc: number,
    public type: 'invalid' | 'incomplete',
    public data?: string | string[]
  ) {
    super()
    const baseMessage = `${codeWc}: ${messageWc}.`
    this.message = data
      ? type === 'incomplete'
        ? ` ${baseMessage} "${data}" is missing in the session namespace.`
        : ` ${baseMessage} "${data}" is invalid.`
      : baseMessage
  }

  get errorCode(): string {
    return this.data ? 'WC_INCOMPLETE_NAMESPACE' : 'WC_INVALID_NAMESPACE'
  }
}

/**
 *  @category Error
 *  @description Error that indicates there is no active session
 */
export class NotConnected extends Error {
  name = 'NotConnected'
  errorCode = 'WC_NOT_CONNECTED'
  beaconErrorType = BeaconErrorType.UNKNOWN_ERROR

  constructor() {
    super('Not connected, no active session')
  }
}

/**
 *  @category Error
 *  @description Error that indicates the session is invalid
 */
export class InvalidSession extends Error {
  name = 'InvalidSession'
  errorCode = 'WC_INVALID_SESSION'
  beaconErrorType = BeaconErrorType.UNKNOWN_ERROR

  constructor(message: string) {
    super(message)
  }
}

/**
 *  @category Error
 *  @description Error that indicates missing required permission scopes
 */
export class MissingRequiredScope extends Error {
  name = 'MissingRequiredScope'
  errorCode = 'WC_MISSING_REQUIRED_SCOPE'
  beaconErrorType = BeaconErrorType.NOT_GRANTED_ERROR

  constructor(public requiredScopes: PermissionScopeMethods | string) {
    super(`Required permission scope were not granted for "${requiredScopes}"`)
  }
}

/**
 *  @category Error
 *  @description Error that indicates the active network is not specified
 */
export class ActiveNetworkUnspecified extends Error {
  name = 'ActiveNetworkUnspecified'
  errorCode = 'WC_ACTIVE_NETWORK_UNSPECIFIED'
  beaconErrorType = BeaconErrorType.PARAMETERS_INVALID_ERROR

  constructor() {
    super('Please specify the active network using the "setActiveNetwork" method.')
  }
}

/**
 *  @category Error
 *  @description Error that indicates the active account is not specified
 */
export class ActiveAccountUnspecified extends Error {
  name = 'ActiveAccountUnspecified'
  errorCode = 'WC_ACTIVE_ACCOUNT_UNSPECIFIED'
  beaconErrorType = BeaconErrorType.NO_ADDRESS_ERROR

  constructor() {
    super('Please specify the active account using the "setActiveAccount" method.')
  }
}

/**
 *  @category Error
 *  @description Error that indicates the combination pkh-network is not part of the active session
 */
export class InvalidNetworkOrAccount extends Error {
  name = 'InvalidNetworkOrAccount'
  errorCode = 'WC_INVALID_NETWORK_OR_ACCOUNT'
  beaconErrorType = BeaconErrorType.NOT_GRANTED_ERROR

  constructor(
    public network: string,
    public pkh: string
  ) {
    super(
      `No permission. The combination "${network}" and "${pkh}" is not part of the active session.`
    )
  }
}
