import { openToast } from './alert/Toast'
import { openAlert } from './alert/Alert'

export enum BeaconEvent {
  PERMISSION_REQUEST_SENT = 'PERMISSION_REQUEST_SENT',
  PERMISSION_REQUEST_ERROR = 'PERMISSION_REQUEST_ERROR',
  OPERATION_REQUEST_SENT = 'OPERATION_REQUEST_SENT',
  OPERATION_REQUEST_ERROR = 'OPERATION_REQUEST_ERROR',
  SIGN_REQUEST_SENT = 'SIGN_REQUEST_SENT',
  SIGN_REQUEST_ERROR = 'SIGN_REQUEST_ERROR',
  BROADCAST_REQUEST_SENT = 'BROADCAST_REQUEST_SENT',
  BROADCAST_REQUEST_ERROR = 'BROADCAST_REQUEST_ERROR',
  LOCAL_RATE_LIMIT_REACHED = 'LOCAL_RATE_LIMIT_REACHED',
  NO_PERMISSIONS = 'NO_PERMISSIONS',

  ACTIVE_ACCOUNT_SET = 'ACTIVE_ACCOUNT_SET',

  UNKNOWN = 'UNKNOWN'
}

const showSentToast = async (): Promise<void> => {
  openToast({ body: 'Request sent', timer: 3000 }).catch((toastError) => console.error(toastError))
}

const showNoPermissionAlert = async (): Promise<void> => {
  await openAlert({
    title: 'No permissions',
    body: 'Please allow the wallet to handle this type of request.'
  })
}

const showRateLimitReached = async (): Promise<void> => {
  openToast({
    body: 'Rate limit reached. Please slow down',
    timer: 3000
  }).catch((toastError) => console.error(toastError))
}

const emptyHandler = async (data?: unknown): Promise<void> => {
  console.error(`no default listener for event ${event}`, data)
}

export type BeaconEventHandlerFunction = (data?: unknown) => Promise<void>

export const defaultEventCallbacks: { [key in BeaconEvent]: BeaconEventHandlerFunction } = {
  [BeaconEvent.PERMISSION_REQUEST_SENT]: showSentToast,
  [BeaconEvent.PERMISSION_REQUEST_ERROR]: showNoPermissionAlert,
  [BeaconEvent.OPERATION_REQUEST_SENT]: showSentToast,
  [BeaconEvent.OPERATION_REQUEST_ERROR]: showNoPermissionAlert,
  [BeaconEvent.SIGN_REQUEST_SENT]: showSentToast,
  [BeaconEvent.SIGN_REQUEST_ERROR]: showNoPermissionAlert,
  [BeaconEvent.BROADCAST_REQUEST_SENT]: showSentToast,
  [BeaconEvent.BROADCAST_REQUEST_ERROR]: showNoPermissionAlert,
  [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: showRateLimitReached,
  [BeaconEvent.NO_PERMISSIONS]: showNoPermissionAlert,
  [BeaconEvent.ACTIVE_ACCOUNT_SET]: emptyHandler,
  [BeaconEvent.UNKNOWN]: emptyHandler
}

export class BeaconEventHandler {
  private readonly callbackMap: { [key in BeaconEvent]: BeaconEventHandlerFunction[] } = {
    [BeaconEvent.PERMISSION_REQUEST_SENT]: [defaultEventCallbacks.PERMISSION_REQUEST_SENT],
    [BeaconEvent.PERMISSION_REQUEST_ERROR]: [defaultEventCallbacks.PERMISSION_REQUEST_ERROR],
    [BeaconEvent.OPERATION_REQUEST_SENT]: [defaultEventCallbacks.OPERATION_REQUEST_SENT],
    [BeaconEvent.OPERATION_REQUEST_ERROR]: [defaultEventCallbacks.OPERATION_REQUEST_ERROR],
    [BeaconEvent.SIGN_REQUEST_SENT]: [defaultEventCallbacks.SIGN_REQUEST_SENT],
    [BeaconEvent.SIGN_REQUEST_ERROR]: [defaultEventCallbacks.SIGN_REQUEST_ERROR],
    [BeaconEvent.BROADCAST_REQUEST_SENT]: [defaultEventCallbacks.BROADCAST_REQUEST_SENT],
    [BeaconEvent.BROADCAST_REQUEST_ERROR]: [defaultEventCallbacks.BROADCAST_REQUEST_ERROR],
    [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: [defaultEventCallbacks.LOCAL_RATE_LIMIT_REACHED],
    [BeaconEvent.NO_PERMISSIONS]: [defaultEventCallbacks.NO_PERMISSIONS],
    [BeaconEvent.ACTIVE_ACCOUNT_SET]: [defaultEventCallbacks.ACTIVE_ACCOUNT_SET],
    [BeaconEvent.UNKNOWN]: [defaultEventCallbacks.UNKNOWN]
  }

  public async on(event: BeaconEvent, eventCallback: BeaconEventHandlerFunction): Promise<void> {
    const listeners = this.callbackMap[event] || []
    listeners.push(eventCallback)
    this.callbackMap[event] = listeners
  }

  public async emit(event: BeaconEvent, data?: unknown): Promise<void> {
    const listeners = this.callbackMap[event]
    if (listeners && listeners.length > 0) {
      listeners.forEach((listener) => {
        listener(data).catch((listenerError) =>
          console.error(`error handling event ${event}`, listenerError)
        )
      })
    }
  }

  public async overrideDefaults(
    eventsToOverride: {
      [key in BeaconEvent]: {
        handler: BeaconEventHandlerFunction
      }
    }
  ): Promise<void> {
    Object.keys(eventsToOverride).forEach((untypedEvent: string) => {
      const event: BeaconEvent = untypedEvent as BeaconEvent
      this.callbackMap[event] = [eventsToOverride[event].handler]
    })
  }
}
