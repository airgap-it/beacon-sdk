import { openToast } from './alert/Toast'
import { openAlert } from './alert/Alert'

export enum InternalEvent {
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

export type InternalEventHandlerFunction = (data?: unknown) => Promise<void>

export const defaultEventCallbacks: { [key in InternalEvent]: InternalEventHandlerFunction } = {
  [InternalEvent.PERMISSION_REQUEST_SENT]: showSentToast,
  [InternalEvent.PERMISSION_REQUEST_ERROR]: showNoPermissionAlert,
  [InternalEvent.OPERATION_REQUEST_SENT]: showSentToast,
  [InternalEvent.OPERATION_REQUEST_ERROR]: showNoPermissionAlert,
  [InternalEvent.SIGN_REQUEST_SENT]: showSentToast,
  [InternalEvent.SIGN_REQUEST_ERROR]: showNoPermissionAlert,
  [InternalEvent.BROADCAST_REQUEST_SENT]: showSentToast,
  [InternalEvent.BROADCAST_REQUEST_ERROR]: showNoPermissionAlert,
  [InternalEvent.LOCAL_RATE_LIMIT_REACHED]: showRateLimitReached,
  [InternalEvent.NO_PERMISSIONS]: showNoPermissionAlert,
  [InternalEvent.ACTIVE_ACCOUNT_SET]: emptyHandler,
  [InternalEvent.UNKNOWN]: emptyHandler
}

export class InternalEventHandler {
  private readonly callbackMap: { [key in InternalEvent]: InternalEventHandlerFunction[] } = {
    [InternalEvent.PERMISSION_REQUEST_SENT]: [],
    [InternalEvent.PERMISSION_REQUEST_ERROR]: [],
    [InternalEvent.OPERATION_REQUEST_SENT]: [],
    [InternalEvent.OPERATION_REQUEST_ERROR]: [],
    [InternalEvent.SIGN_REQUEST_SENT]: [],
    [InternalEvent.SIGN_REQUEST_ERROR]: [],
    [InternalEvent.BROADCAST_REQUEST_SENT]: [],
    [InternalEvent.BROADCAST_REQUEST_ERROR]: [],
    [InternalEvent.LOCAL_RATE_LIMIT_REACHED]: [],
    [InternalEvent.NO_PERMISSIONS]: [],
    [InternalEvent.ACTIVE_ACCOUNT_SET]: [],
    [InternalEvent.UNKNOWN]: []
  }

  public async on(
    event: InternalEvent,
    eventCallback: InternalEventHandlerFunction
  ): Promise<void> {
    const listeners = this.callbackMap[event] || []
    listeners.push(eventCallback)
    this.callbackMap[event] = listeners
  }

  public async emit(event: InternalEvent, data?: unknown): Promise<void> {
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
      [key in InternalEvent]: {
        handler: InternalEventHandlerFunction
      }
    }
  ): Promise<void> {
    Object.keys(eventsToOverride).forEach((untypedEvent: string) => {
      const event: InternalEvent = untypedEvent as InternalEvent
      this.callbackMap[event].push(eventsToOverride[event].handler)
    })
  }
}
