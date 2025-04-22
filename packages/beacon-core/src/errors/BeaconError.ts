import { BeaconErrorType } from '@airgap/beacon-types'

/**
 * @category Error
 */
export abstract class BeaconError implements Error {
  public name: string = 'BeaconError'
  public message: string

  public title: string = 'Error' // Visible in the UI
  public description: string // Visible in the UI

  public get fullDescription(): { description: string; data?: string } {
    return { description: this.description }
  }

  constructor(errorType: BeaconErrorType, message: string) {
    this.message = `[${errorType}]:${message}`
    this.description = message
  }
}
