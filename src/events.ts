import { openToast } from './alert/Toast'
import { openAlert } from './alert/Alert'

export enum BeaconEvents {
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

const listenerFallback = async (data?: unknown): Promise<void> => {
  console.error(`no default listener for event ${event}`, data)
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

const emptyHandler = async (): Promise<void> => {
  /* Do nothing */
}

export type BeaconEventHandlerFunction = (data?: unknown) => Promise<void>

export const defaultEventCallbacks: { [key in BeaconEvents]: BeaconEventHandlerFunction } = {
  [BeaconEvents.PERMISSION_REQUEST_SENT]: showSentToast,
  [BeaconEvents.PERMISSION_REQUEST_ERROR]: showNoPermissionAlert,
  [BeaconEvents.OPERATION_REQUEST_SENT]: showSentToast,
  [BeaconEvents.OPERATION_REQUEST_ERROR]: showNoPermissionAlert,
  [BeaconEvents.SIGN_REQUEST_SENT]: showSentToast,
  [BeaconEvents.SIGN_REQUEST_ERROR]: showNoPermissionAlert,
  [BeaconEvents.BROADCAST_REQUEST_SENT]: showSentToast,
  [BeaconEvents.BROADCAST_REQUEST_ERROR]: showNoPermissionAlert,
  [BeaconEvents.LOCAL_RATE_LIMIT_REACHED]: showRateLimitReached,
  [BeaconEvents.NO_PERMISSIONS]: showNoPermissionAlert,
  [BeaconEvents.ACTIVE_ACCOUNT_SET]: emptyHandler,
  [BeaconEvents.UNKNOWN]: emptyHandler
}

export class BeaconEventHandler {
  private readonly callbackMap: { [key in BeaconEvents]: BeaconEventHandlerFunction[] } = {
    [BeaconEvents.PERMISSION_REQUEST_SENT]: [],
    [BeaconEvents.PERMISSION_REQUEST_ERROR]: [],
    [BeaconEvents.OPERATION_REQUEST_SENT]: [],
    [BeaconEvents.OPERATION_REQUEST_ERROR]: [],
    [BeaconEvents.SIGN_REQUEST_SENT]: [],
    [BeaconEvents.SIGN_REQUEST_ERROR]: [],
    [BeaconEvents.BROADCAST_REQUEST_SENT]: [],
    [BeaconEvents.BROADCAST_REQUEST_ERROR]: [],
    [BeaconEvents.LOCAL_RATE_LIMIT_REACHED]: [],
    [BeaconEvents.NO_PERMISSIONS]: [],
    [BeaconEvents.ACTIVE_ACCOUNT_SET]: [],
    [BeaconEvents.UNKNOWN]: []
  }

  public async on(event: BeaconEvents, eventCallback: BeaconEventHandlerFunction): Promise<void> {
    const listeners = this.callbackMap[event] || []
    listeners.push(eventCallback)
    this.callbackMap[event] = listeners
  }

  public async emit(event: BeaconEvents, data?: unknown): Promise<void> {
    const listeners = this.callbackMap[event]
    if (listeners && listeners.length > 0) {
      listeners.forEach((listener) => {
        listener(data).catch((listenerError) =>
          console.error(`error handling event ${event}`, listenerError)
        )
      })
    } else {
      const listener = defaultEventCallbacks[event] || listenerFallback
      await listener(data)
    }
  }

  public async overrideDefaults(
    eventsToOverride: {
      [key in BeaconEvents]: {
        handler: BeaconEventHandlerFunction
      }
    }
  ): Promise<void> {
    Object.keys(eventsToOverride).forEach((untypedEvent: string) => {
      const event: BeaconEvents = untypedEvent as BeaconEvents
      this.callbackMap[event].push(eventsToOverride[event].handler)
    })
  }
}
