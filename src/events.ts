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

const showSentToast = () => {
  openToast({ body: 'Request sent', timer: 3000 }).catch((toastError) => console.error(toastError))
}

const showNoPermissionAlert = async (): Promise<void> => {
  await openAlert({
    title: 'No permissions',
    body: 'Please allow the wallet to handle this type of request.'
  })
}

export type InternalEventHandlerFunction = (data?: unknown) => Promise<void>

export class InternalEventHandler {
  private readonly defaultCallbacks: { [key in InternalEvent]: InternalEventHandlerFunction }
  private readonly callbackMap: { [key in InternalEvent]: InternalEventHandlerFunction[] }

  constructor() {
    this.defaultCallbacks = {
      [InternalEvent.PERMISSION_REQUEST_SENT]: async (_data?: unknown): Promise<void> => {
        showSentToast()
      },
      [InternalEvent.PERMISSION_REQUEST_ERROR]: async (_data?: unknown): Promise<void> => {
        await showNoPermissionAlert()
      },
      [InternalEvent.OPERATION_REQUEST_SENT]: async (_data?: unknown): Promise<void> => {
        showSentToast()
      },
      [InternalEvent.OPERATION_REQUEST_ERROR]: async (_data?: unknown): Promise<void> => {
        await showNoPermissionAlert()
      },
      [InternalEvent.SIGN_REQUEST_SENT]: async (_data?: unknown): Promise<void> => {
        showSentToast()
      },
      [InternalEvent.SIGN_REQUEST_ERROR]: async (_data?: unknown): Promise<void> => {
        await showNoPermissionAlert()
      },
      [InternalEvent.BROADCAST_REQUEST_SENT]: async (_data?: unknown): Promise<void> => {
        showSentToast()
      },
      [InternalEvent.BROADCAST_REQUEST_ERROR]: async (_data?: unknown): Promise<void> => {
        await showNoPermissionAlert()
      },
      [InternalEvent.LOCAL_RATE_LIMIT_REACHED]: async (_data?: unknown): Promise<void> => {
        openToast({
          body: 'Rate limit reached. Please slow down',
          timer: 3000
        }).catch((toastError) => console.error(toastError))
      },
      [InternalEvent.NO_PERMISSIONS]: async (_data?: unknown): Promise<void> => {
        openToast({
          body: 'No permissions!',
          timer: 3000
        }).catch((toastError) => console.error(toastError))
      },
      [InternalEvent.ACTIVE_ACCOUNT_SET]: async (data?: unknown): Promise<void> => {
        console.log('internal event: active account set', data)
      },
      [InternalEvent.UNKNOWN]: async (_data?: unknown): Promise<void> => {
        /* Do nothing */
      }
    }

    this.callbackMap = {
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
      const listener = this.defaultCallbacks[event] || listenerFallback
      await listener(data)
    }
  }
}
