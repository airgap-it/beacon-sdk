export enum PermissionScope {
  SIGN = 'sign', // Allows the DApp to send requests to sign arbitrary payload
  OPERATION_REQUEST = 'operation_request', // Allows the DApp to send requests to sign and broadcast Tezos Operations
  ENCRYPT = 'encrypt', // Allows the DApp to send encryption and decryption requests
  NOTIFIACTION = 'notification', // Allows the DApp to send push notifications to the Wallet
  THRESHOLD = 'threshold' // Allows the DApp to sign transactions below a certain threshold. This is currently not fully defined and unused
}
