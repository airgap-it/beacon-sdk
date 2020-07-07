import {
  BeaconErrorMessage,
  DAppClient,
  Network,
  NetworkType,
  PermissionScope,
  TezosOperationType,
  OperationResponseOutput,
  PermissionResponseOutput
} from '..' // Replace '..' with '@airgap/beacon-sdk'
import { PartialTezosTransactionOperation } from '../types/tezos/PartialTezosOperation'

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
  .then(async (permissionResponse: PermissionResponseOutput) => {
    if (
      permissionResponse.scopes.some(
        (permission: PermissionScope) => permission === PermissionScope.OPERATION_REQUEST
      )
    ) {
      const operation: PartialTezosTransactionOperation = {
        kind: TezosOperationType.TRANSACTION,
        amount: '1234567',
        destination: 'tz1MJx9vhaNRSimcuXPK2rW4fLccQnDAnVKJ'
      }
      const operationResponse: OperationResponseOutput = await client.requestOperation({
        operationDetails: [operation]
      })

      console.log(
        'operation was successfully broadcast to the network with the hash: ',
        operationResponse.transactionHash
      )
    }
  })
  .catch((permissionError: BeaconErrorMessage) => console.error(permissionError))
