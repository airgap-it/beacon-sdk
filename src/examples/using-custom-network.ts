import {
  BeaconErrorMessage,
  DAppClient,
  Network,
  NetworkType,
  PermissionScope,
  TezosTransactionOperation,
  TezosOperationType,
  OperationResponseOutput,
  PermissionResponseOutput
} from '..'

const client = new DAppClient({ name: 'My Sample DApp' })

const network: Network = {
  type: NetworkType.CUSTOM,
  name: 'MyLocalNetwork',
  rpcUrl: 'http://localhost:8888/'
}

const scopes: PermissionScope[] = [
  PermissionScope.OPERATION_REQUEST,
  PermissionScope.SIGN,
  PermissionScope.THRESHOLD
]

client
  .requestPermissions({
    network,
    scopes
  })
  .then((permissionResponse: PermissionResponseOutput) => {
    // Check if operation permissions were granted
    if (
      permissionResponse.scopes.some(
        (permission: PermissionScope) => permission === PermissionScope.OPERATION_REQUEST
      )
    ) {
      const operation: Partial<TezosTransactionOperation> = {
        kind: TezosOperationType.TRANSACTION,
        amount: '1234567',
        destination: 'tz1MJx9vhaNRSimcuXPK2rW4fLccQnDAnVKJ'
      }
      client
        .requestOperation({ network, operationDetails: [operation] })
        .then((operationResponse: OperationResponseOutput) => {
          console.log(
            'operation was successfully broadcast to the network with the hash: ',
            operationResponse
          )
        })
        .catch((operationError: BeaconErrorMessage) => console.error(operationError))
    }
  })
  .catch((permissionError: BeaconErrorMessage) => console.error(permissionError))
