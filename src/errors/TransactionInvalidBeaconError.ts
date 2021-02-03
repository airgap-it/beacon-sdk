import { BeaconError, BeaconErrorType } from '..'

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

  constructor(public readonly data: any) {
    super(
      BeaconErrorType.TRANSACTION_INVALID_ERROR,
      `The transaction is invalid and the node did not accept it.`
    )
    this.data = data
  }
}
