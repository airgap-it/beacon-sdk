export enum BeaconMessageType {
  BlockchainRequest = 'blockchain_request',
  PermissionRequest = 'permission_request',
  SignPayloadRequest = 'sign_payload_request',
  // EncryptPayloadRequest = 'encrypt_payload_request',
  OperationRequest = 'operation_request',
  BroadcastRequest = 'broadcast_request',
  BlockchainResponse = 'blockchain_response',
  PermissionResponse = 'permission_response',
  SignPayloadResponse = 'sign_payload_response',
  // EncryptPayloadResponse = 'encrypt_payload_response',
  OperationResponse = 'operation_response',
  BroadcastResponse = 'broadcast_response',
  Acknowledge = 'acknowledge',
  Disconnect = 'disconnect',
  Error = 'error'
}
