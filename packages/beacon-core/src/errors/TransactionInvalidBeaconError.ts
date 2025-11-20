import { BeaconErrorType } from '@airgap/beacon-types'

import { BEACON_ERROR_CODES } from './error-codes'
import { BeaconError } from './BeaconError'

/**
 * @category Error
 */
export class TransactionInvalidBeaconError extends BeaconError {
  public name: string = 'TransactionInvalidBeaconError'
  public title: string = 'Transaction Invalid'

  public get fullDescription(): { description: string; data?: string } {
    return { description: this.description, data: JSON.stringify(this.data, undefined, 2) }
  }

  constructor(public readonly data: unknown) {
    super(
      BeaconErrorType.TRANSACTION_INVALID_ERROR,
      `The transaction is invalid and the node did not accept it.`,
      BEACON_ERROR_CODES.TRANSACTION_INVALID
    )
    this.data = data
  }
}
