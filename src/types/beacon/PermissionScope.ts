export enum PermissionScope {
  READ_ADDRESS = 'read_address', // Allows the DApp to see the address of the wallet
  SIGN = 'sign', // Allows the DApp to send requests to sign arbitrary payload
  OPERATION_REQUEST = 'operation_request', // Allows the DApp to send requests to sign and broadcast Tezos Operations
  THRESHOLD = 'threshold' // Allows the DApp to sign transactions below a certain threshold. This is currently not fully defined and unused
}
