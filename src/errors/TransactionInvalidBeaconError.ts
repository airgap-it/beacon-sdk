import { BeaconError, BeaconErrorType } from '..'

export class TransactionInvalidBeaconError extends BeaconError {
  public name: string = 'TransactionInvalidBeaconError'
  public title: string = 'Transaction Invalid'

  constructor() {
    super(
      BeaconErrorType.TRANSACTION_INVALID_ERROR,
      'The transaction is invalid and the node did not accept it.'
    )
  }
}
