import {
  TezosOperationType,
  DAppClient,
  TezosTransactionOperation,
  OperationResponse,
  BeaconErrorMessage
} from '..'

const client = new DAppClient('My Sample DApp')

const operation: Partial<TezosTransactionOperation> = {
  kind: TezosOperationType.TRANSACTION,
  amount: '1234567',
  destination: 'tz1MJx9vhaNRSimcuXPK2rW4fLccQnDAnVKJ'
}

client
  .requestOperation({
    operationDetails: [operation]
  })
  .then((response: OperationResponse) => {
    console.log('transaction hash', response.transactionHash)
  })
  .catch((operationError: BeaconErrorMessage) => console.error(operationError))
