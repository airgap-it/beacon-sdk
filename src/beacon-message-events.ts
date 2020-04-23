import { InternalEvent } from './events'
import { BeaconMessageType } from '.'

export const messageEvents: {
  [key in BeaconMessageType]: { success: InternalEvent; error: InternalEvent }
} = {
  [BeaconMessageType.PermissionRequest]: {
    success: InternalEvent.PERMISSION_REQUEST_SENT,
    error: InternalEvent.PERMISSION_REQUEST_ERROR
  },
  [BeaconMessageType.PermissionResponse]: {
    success: InternalEvent.UNKNOWN,
    error: InternalEvent.UNKNOWN
  },
  [BeaconMessageType.OperationRequest]: {
    success: InternalEvent.OPERATION_REQUEST_SENT,
    error: InternalEvent.OPERATION_REQUEST_ERROR
  },
  [BeaconMessageType.OperationResponse]: {
    success: InternalEvent.UNKNOWN,
    error: InternalEvent.UNKNOWN
  },
  [BeaconMessageType.SignPayloadRequest]: {
    success: InternalEvent.SIGN_REQUEST_SENT,
    error: InternalEvent.SIGN_REQUEST_ERROR
  },
  [BeaconMessageType.SignPayloadResponse]: {
    success: InternalEvent.UNKNOWN,
    error: InternalEvent.UNKNOWN
  },
  [BeaconMessageType.BroadcastRequest]: {
    success: InternalEvent.BROADCAST_REQUEST_SENT,
    error: InternalEvent.BROADCAST_REQUEST_ERROR
  },
  [BeaconMessageType.BroadcastResponse]: {
    success: InternalEvent.UNKNOWN,
    error: InternalEvent.UNKNOWN
  }
}
