import {
  TezosOperationType,
  DAppClient,
  TezosTransactionOperation,
  BeaconErrorMessage,
  OperationResponseOutput
} from '..'

const client = new DAppClient({ name: 'My Sample DApp' })

const operation: Partial<TezosTransactionOperation> = {
  kind: TezosOperationType.TRANSACTION,
  amount: '1234567',
  destination: 'tz1MJx9vhaNRSimcuXPK2rW4fLccQnDAnVKJ'
}

client
  .requestOperation({
    operationDetails: [operation]
  })
  .then((response: OperationResponseOutput) => {
    console.log('transaction hash', response.transactionHash)
  })
  .catch((operationError: BeaconErrorMessage) => console.error(operationError))
