import { BeaconEvent } from './events'
import { BeaconMessageType } from '@mavrykdynamics/beacon-types'

export const messageEvents: {
  [key in BeaconMessageType]: { sent: BeaconEvent; success: BeaconEvent; error: BeaconEvent }
} = {
  [BeaconMessageType.BlockchainRequest]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.BlockchainResponse]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.PermissionRequest]: {
    sent: BeaconEvent.PERMISSION_REQUEST_SENT,
    success: BeaconEvent.PERMISSION_REQUEST_SUCCESS,
    error: BeaconEvent.PERMISSION_REQUEST_ERROR
  },
  [BeaconMessageType.PermissionResponse]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.OperationRequest]: {
    sent: BeaconEvent.OPERATION_REQUEST_SENT,
    success: BeaconEvent.OPERATION_REQUEST_SUCCESS,
    error: BeaconEvent.OPERATION_REQUEST_ERROR
  },
  [BeaconMessageType.OperationResponse]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.SignPayloadRequest]: {
    sent: BeaconEvent.SIGN_REQUEST_SENT,
    success: BeaconEvent.SIGN_REQUEST_SUCCESS,
    error: BeaconEvent.SIGN_REQUEST_ERROR
  },
  [BeaconMessageType.SignPayloadResponse]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  // TODO: ENCRYPTION
  // [BeaconMessageType.EncryptPayloadRequest]: {
  //   sent: BeaconEvent.ENCRYPT_REQUEST_SENT,
  //   success: BeaconEvent.ENCRYPT_REQUEST_SUCCESS,
  //   error: BeaconEvent.ENCRYPT_REQUEST_ERROR
  // },
  // [BeaconMessageType.EncryptPayloadResponse]: {
  //   sent: BeaconEvent.UNKNOWN,
  //   success: BeaconEvent.UNKNOWN,
  //   error: BeaconEvent.UNKNOWN
  // },
  [BeaconMessageType.BroadcastRequest]: {
    sent: BeaconEvent.BROADCAST_REQUEST_SENT,
    success: BeaconEvent.BROADCAST_REQUEST_SUCCESS,
    error: BeaconEvent.BROADCAST_REQUEST_ERROR
  },
  [BeaconMessageType.BroadcastResponse]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.ChangeAccountRequest]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.Acknowledge]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.Disconnect]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.Error]: {
    sent: BeaconEvent.UNKNOWN,
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  }
}
