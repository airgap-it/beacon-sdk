import { BeaconError } from '..'
import { BeaconErrorType } from '@mavrykdynamics/beacon-types'

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
      `The transaction is invalid and the node did not accept it.`
    )
    this.data = data
  }
}
