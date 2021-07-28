import { BeaconError } from '..'
import { BeaconErrorType } from '@airgap/beacon-types'

/**
 * @category Error
 */
export class TransactionInvalidBeaconError extends BeaconError {
  public name: string = 'TransactionInvalidBeaconError'
  public title: string = 'Transaction Invalid'

  public get fullDescription(): string {
    return `${this.description}<br /><pre style="text-align: left">${JSON.stringify(
      this.data,
      undefined,
      2
    )}</pre>`
  }

  constructor(public readonly data: unknown) {
    super(
      BeaconErrorType.TRANSACTION_INVALID_ERROR,
      `The transaction is invalid and the node did not accept it.`
    )
    this.data = data
  }
}
