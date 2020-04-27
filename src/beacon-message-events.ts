import { BeaconEvents } from './events'
import { BeaconMessageType } from '.'

export const messageEvents: {
  [key in BeaconMessageType]: { success: BeaconEvents; error: BeaconEvents }
} = {
  [BeaconMessageType.PermissionRequest]: {
    success: BeaconEvents.PERMISSION_REQUEST_SENT,
    error: BeaconEvents.PERMISSION_REQUEST_ERROR
  },
  [BeaconMessageType.PermissionResponse]: {
    success: BeaconEvents.UNKNOWN,
    error: BeaconEvents.UNKNOWN
  },
  [BeaconMessageType.OperationRequest]: {
    success: BeaconEvents.OPERATION_REQUEST_SENT,
    error: BeaconEvents.OPERATION_REQUEST_ERROR
  },
  [BeaconMessageType.OperationResponse]: {
    success: BeaconEvents.UNKNOWN,
    error: BeaconEvents.UNKNOWN
  },
  [BeaconMessageType.SignPayloadRequest]: {
    success: BeaconEvents.SIGN_REQUEST_SENT,
    error: BeaconEvents.SIGN_REQUEST_ERROR
  },
  [BeaconMessageType.SignPayloadResponse]: {
    success: BeaconEvents.UNKNOWN,
    error: BeaconEvents.UNKNOWN
  },
  [BeaconMessageType.BroadcastRequest]: {
    success: BeaconEvents.BROADCAST_REQUEST_SENT,
    error: BeaconEvents.BROADCAST_REQUEST_ERROR
  },
  [BeaconMessageType.BroadcastResponse]: {
    success: BeaconEvents.UNKNOWN,
    error: BeaconEvents.UNKNOWN
  }
}
