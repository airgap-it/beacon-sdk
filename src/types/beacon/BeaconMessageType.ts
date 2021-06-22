export enum BeaconMessageType {
  PermissionRequest = 'permission_request',
  SignPayloadRequest = 'sign_payload_request',
  EncryptPayloadRequest = 'encrypt_payload_request',
  OperationRequest = 'operation_request',
  BroadcastRequest = 'broadcast_request',
  PermissionResponse = 'permission_response',
  SignPayloadResponse = 'sign_payload_response',
  EncryptPayloadResponse = 'encrypt_payload_response',
  OperationResponse = 'operation_response',
  BroadcastResponse = 'broadcast_response',
  Acknowledge = 'acknowledge',
  Disconnect = 'disconnect',
  Error = 'error'
}
