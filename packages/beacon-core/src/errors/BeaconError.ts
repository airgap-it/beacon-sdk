import { BeaconErrorType } from '@airgap/beacon-types'

import { ErrorCode } from './error-codes'

/**
 * @category Error
 */
export abstract class BeaconError extends Error {
  public name: string = 'BeaconError'

  public title: string = 'Error' // Visible in the UI
  public description: string // Visible in the UI

  public type: BeaconErrorType
  public code: ErrorCode

  public get errorType(): BeaconErrorType {
    return this.type
  }

  public get fullDescription(): { description: string; data?: string } {
    return { description: this.description }
  }

  constructor(errorType: BeaconErrorType, message: string, code: ErrorCode) {
    super(`[${errorType}]:${message}`)
    this.name = 'BeaconError'
    this.description = message
    this.type = errorType
    this.code = code
  }
}
