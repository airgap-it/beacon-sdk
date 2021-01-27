import { BeaconError, BeaconErrorType } from '..'

export class TransactionInvalidBeaconError extends BeaconError {
  public name: string = 'TransactionInvalidBeaconError'
  public title: string = 'Transaction Invalid'

  constructor(public readonly data: any) {
    super(
      BeaconErrorType.TRANSACTION_INVALID_ERROR,
      `The transaction is invalid and the node did not accept it.<br /><pre style="text-align: left">${JSON.stringify(
        data,
        undefined,
        2
      )}</pre>`
    )
  }
}
