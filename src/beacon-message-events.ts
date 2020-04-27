import { BeaconEvent } from './events'
import { BeaconMessageType } from '.'

export const messageEvents: {
  [key in BeaconMessageType]: { success: BeaconEvent; error: BeaconEvent }
} = {
  [BeaconMessageType.PermissionRequest]: {
    success: BeaconEvent.PERMISSION_REQUEST_SENT,
    error: BeaconEvent.PERMISSION_REQUEST_ERROR
  },
  [BeaconMessageType.PermissionResponse]: {
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.OperationRequest]: {
    success: BeaconEvent.OPERATION_REQUEST_SENT,
    error: BeaconEvent.OPERATION_REQUEST_ERROR
  },
  [BeaconMessageType.OperationResponse]: {
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.SignPayloadRequest]: {
    success: BeaconEvent.SIGN_REQUEST_SENT,
    error: BeaconEvent.SIGN_REQUEST_ERROR
  },
  [BeaconMessageType.SignPayloadResponse]: {
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  },
  [BeaconMessageType.BroadcastRequest]: {
    success: BeaconEvent.BROADCAST_REQUEST_SENT,
    error: BeaconEvent.BROADCAST_REQUEST_ERROR
  },
  [BeaconMessageType.BroadcastResponse]: {
    success: BeaconEvent.UNKNOWN,
    error: BeaconEvent.UNKNOWN
  }
}
