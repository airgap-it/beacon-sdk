import {
  BlockExplorer,
  openAlert,
  AlertButton,
  AlertConfig,
  closeAlerts,
  closeToast,
  openToast,
  ToastAction
} from '@airgap/beacon-dapp'
import {
  BeaconErrorType,
  ExtendedPostMessagePairingResponse,
  PostMessagePairingRequest,
  ExtendedP2PPairingResponse,
  P2PPairingRequest,
  AccountInfo,
  ErrorResponse,
  PermissionResponseOutput,
  OperationResponseOutput,
  BroadcastResponseOutput,
  SignPayloadResponseOutput,
  Network,
  ConnectionContext,
  NetworkType,
  AcknowledgeResponse,
  WalletInfo
} from '@airgap/beacon-types'
import {
  UnknownBeaconError,
  BeaconError,
  Transport,
  Logger
  // EncryptPayloadResponseOutput,
  // EncryptionOperation
} from '@airgap/beacon-core'
import { shortenString } from './utils/shorten-string'
import { isMobile } from '@airgap/beacon-ui'

const logger = new Logger('BeaconEvents')

const SUCCESS_TIMER: number = 5 * 1000

type RPCError = {
  kind: string
  id: string
  contract_handle?: string
  location?: number
  with?: {
    string?: string
    int?: number
  }
}
/**
 * The different events that can be emitted by the beacon-sdk
 */
export enum BeaconEvent {
  PERMISSION_REQUEST_SENT = 'PERMISSION_REQUEST_SENT',
  PERMISSION_REQUEST_SUCCESS = 'PERMISSION_REQUEST_SUCCESS',
  PERMISSION_REQUEST_ERROR = 'PERMISSION_REQUEST_ERROR',
  OPERATION_REQUEST_SENT = 'OPERATION_REQUEST_SENT',
  OPERATION_REQUEST_SUCCESS = 'OPERATION_REQUEST_SUCCESS',
  OPERATION_REQUEST_ERROR = 'OPERATION_REQUEST_ERROR',
  SIGN_REQUEST_SENT = 'SIGN_REQUEST_SENT',
  SIGN_REQUEST_SUCCESS = 'SIGN_REQUEST_SUCCESS',
  SIGN_REQUEST_ERROR = 'SIGN_REQUEST_ERROR',
  // TODO: ENCRYPTION
  // ENCRYPT_REQUEST_SENT = 'ENCRYPT_REQUEST_SENT',
  // ENCRYPT_REQUEST_SUCCESS = 'ENCRYPT_REQUEST_SUCCESS',
  // ENCRYPT_REQUEST_ERROR = 'ENCRYPT_REQUEST_ERROR',
  BROADCAST_REQUEST_SENT = 'BROADCAST_REQUEST_SENT',
  BROADCAST_REQUEST_SUCCESS = 'BROADCAST_REQUEST_SUCCESS',
  BROADCAST_REQUEST_ERROR = 'BROADCAST_REQUEST_ERROR',

  ACKNOWLEDGE_RECEIVED = 'ACKNOWLEDGE_RECEIVED',

  LOCAL_RATE_LIMIT_REACHED = 'LOCAL_RATE_LIMIT_REACHED',

  NO_PERMISSIONS = 'NO_PERMISSIONS',

  ACTIVE_ACCOUNT_SET = 'ACTIVE_ACCOUNT_SET',

  ACTIVE_TRANSPORT_SET = 'ACTIVE_TRANSPORT_SET',

  SHOW_PREPARE = 'SHOW_PREPARE',
  HIDE_UI = 'HIDE_UI',

  PAIR_INIT = 'PAIR_INIT',
  PAIR_SUCCESS = 'PAIR_SUCCESS',
  CHANNEL_CLOSED = 'CHANNEL_CLOSED',

  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface ExtraInfo {
  resetCallback?(): Promise<void>
}

interface RequestSentInfo {
  extraInfo: ExtraInfo
  walletInfo: WalletInfo
}

/**
 * The type of the payload of the different BeaconEvents
 */
export interface BeaconEventType {
  [BeaconEvent.PERMISSION_REQUEST_SENT]: RequestSentInfo
  [BeaconEvent.PERMISSION_REQUEST_SUCCESS]: {
    account: AccountInfo
    output: PermissionResponseOutput
    blockExplorer: BlockExplorer
    connectionContext: ConnectionContext
    walletInfo: WalletInfo
  }
  [BeaconEvent.PERMISSION_REQUEST_ERROR]: { errorResponse: ErrorResponse; walletInfo: WalletInfo }
  [BeaconEvent.OPERATION_REQUEST_SENT]: RequestSentInfo
  [BeaconEvent.OPERATION_REQUEST_SUCCESS]: {
    account: AccountInfo
    output: OperationResponseOutput
    blockExplorer: BlockExplorer
    connectionContext: ConnectionContext
    walletInfo: WalletInfo
  }
  [BeaconEvent.OPERATION_REQUEST_ERROR]: {
    errorResponse: ErrorResponse
    walletInfo: WalletInfo
    errorMessages: Record<string, Record<string | number, string>>
  }
  [BeaconEvent.SIGN_REQUEST_SENT]: RequestSentInfo
  [BeaconEvent.SIGN_REQUEST_SUCCESS]: {
    output: SignPayloadResponseOutput
    connectionContext: ConnectionContext
    walletInfo: WalletInfo
  }
  [BeaconEvent.SIGN_REQUEST_ERROR]: { errorResponse: ErrorResponse; walletInfo: WalletInfo }
  // TODO: ENCRYPTION
  // [BeaconEvent.ENCRYPT_REQUEST_SENT]: RequestSentInfo
  // [BeaconEvent.ENCRYPT_REQUEST_SUCCESS]: {
  //   output: EncryptPayloadResponseOutput
  //   connectionContext: ConnectionContext
  //   walletInfo: WalletInfo
  // }
  // [BeaconEvent.ENCRYPT_REQUEST_ERROR]: { errorResponse: ErrorResponse; walletInfo: WalletInfo }
  [BeaconEvent.BROADCAST_REQUEST_SENT]: RequestSentInfo
  [BeaconEvent.BROADCAST_REQUEST_SUCCESS]: {
    network: Network
    output: BroadcastResponseOutput
    blockExplorer: BlockExplorer
    connectionContext: ConnectionContext
    walletInfo: WalletInfo
  }
  [BeaconEvent.BROADCAST_REQUEST_ERROR]: { errorResponse: ErrorResponse; walletInfo: WalletInfo }
  [BeaconEvent.ACKNOWLEDGE_RECEIVED]: {
    message: AcknowledgeResponse
    extraInfo: ExtraInfo
    walletInfo: WalletInfo
  }
  [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: undefined
  [BeaconEvent.NO_PERMISSIONS]: undefined
  [BeaconEvent.ACTIVE_ACCOUNT_SET]: AccountInfo
  [BeaconEvent.ACTIVE_TRANSPORT_SET]: Transport
  [BeaconEvent.SHOW_PREPARE]: { walletInfo?: WalletInfo }
  [BeaconEvent.HIDE_UI]: ('alert' | 'toast')[] | undefined
  [BeaconEvent.PAIR_INIT]: {
    p2pPeerInfo: () => Promise<P2PPairingRequest>
    postmessagePeerInfo: () => Promise<PostMessagePairingRequest>
    preferredNetwork: NetworkType
    abortedHandler?(): void
    disclaimerText?: string
  }
  [BeaconEvent.PAIR_SUCCESS]: ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse
  [BeaconEvent.CHANNEL_CLOSED]: string
  [BeaconEvent.INTERNAL_ERROR]: { text: string; buttons?: AlertButton[] }
  [BeaconEvent.UNKNOWN]: undefined
}

/**
 * Show a "Request sent" toast
 */
const showSentToast = async (data: RequestSentInfo): Promise<void> => {
  let openWalletAction
  const actions: ToastAction[] = []
  if (data.walletInfo.deeplink) {
    if (
      data.walletInfo.type === 'web' ||
      (data.walletInfo.type === 'mobile' && isMobile(window)) ||
      (data.walletInfo.type === 'desktop' && !isMobile(window))
    ) {
      const link = data.walletInfo.deeplink
      openWalletAction = async (): Promise<void> => {
        const a = document.createElement('a')
        a.setAttribute('href', link)
        a.setAttribute('target', '_blank')
        a.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }))
      }
    }
  }
  actions.push({
    text: `No answer from your wallet received yet. Please make sure the wallet is open.`,
    isBold: true
  })
  actions.push({
    text: 'Did you make a mistake?',
    actionText: 'Cancel Request',
    actionCallback: async (): Promise<void> => {
      await closeToast()
    }
  })
  actions.push({
    text: 'Wallet not receiving request?',
    actionText: 'Reset Connection',
    actionCallback: async (): Promise<void> => {
      await closeToast()
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const resetCallback = data.extraInfo.resetCallback
      if (resetCallback) {
        logger.log('showSentToast', 'resetCallback invoked')
        await resetCallback()
      }
    }
  })

  openToast({
    body: `Request sent to\u00A0 {{wallet}}`,
    walletInfo: data.walletInfo,
    state: 'loading',
    actions,
    openWalletAction
  }).catch((toastError) => console.error(toastError))
}

const showAcknowledgedToast = async (data: {
  message: AcknowledgeResponse
  extraInfo: ExtraInfo
  walletInfo: WalletInfo
}): Promise<void> => {
  openToast({
    body: 'Awaiting confirmation in\u00A0 {{wallet}}',
    state: 'acknowledge',
    walletInfo: data.walletInfo
  }).catch((toastError) => console.error(toastError))
}

const showPrepare = async (data: { walletInfo?: WalletInfo }): Promise<void> => {
  const text = data.walletInfo
    ? `Preparing Request for\u00A0 {{wallet}}...`
    : 'Preparing Request...'
  openToast({
    body: text,
    state: 'prepare',
    walletInfo: data.walletInfo
  }).catch((toastError) => console.error(toastError))
}

const hideUI = async (elements?: ('alert' | 'toast')[]): Promise<void> => {
  if (elements) {
    if (elements.includes('alert')) {
      closeAlerts()
    }
    if (elements.includes('toast')) {
      closeToast()
    }
  } else {
    closeToast()
  }
}

/**
 * Show a "No Permission" alert
 */
const showNoPermissionAlert = async (): Promise<void> => {
  await openAlert({
    title: 'No Permission',
    body: 'Please allow the wallet to handle this type of request.'
  })
}

/**
 * Show an error toast
 *
 * @param beaconError The beacon error
 */
const showErrorToast = async (
  response: {
    errorResponse: ErrorResponse
    walletInfo: WalletInfo
    errorMessages?: Record<string, Record<string | number, string>>
  },
  buttons?: AlertButton[]
): Promise<void> => {
  const error = response.errorResponse.errorType
    ? BeaconError.getError(response.errorResponse.errorType, response.errorResponse.errorData)
    : new UnknownBeaconError()

  const actions: ToastAction[] = [
    {
      text: error.title,
      isBold: true
    }
  ]

  if (
    response.errorResponse.errorType === BeaconErrorType.TRANSACTION_INVALID_ERROR &&
    response.errorResponse.errorData
  ) {
    const err: RPCError[] = response.errorResponse.errorData
    const errorMessages = response.errorMessages

    let hasHumandReadableError = false

    if (err[0]?.contract_handle && errorMessages && errorMessages?.[err[0].contract_handle]) {
      const errCode = err[1]?.with?.int ?? err[1]?.with?.string
      const contractErrors = errorMessages?.[err[0].contract_handle]
      if (errCode && contractErrors?.[errCode]) {
        actions.push({
          text: contractErrors?.[errCode],
          isBold: true
        })
        hasHumandReadableError = true
      }
    }

    if (!hasHumandReadableError) {
      actions.push({
        text: error.description
      })
    }

    actions.push({
      text: '',
      actionText: 'Show Details',
      actionCallback: async (): Promise<void> => {
        await closeToast()
        await openAlert({
          title: error.title,
          // eslint-disable-next-line @typescript-eslint/unbound-method
          body: error.fullDescription.description,
          data: error.fullDescription.data,
          buttons
        })
      }
    })
  }

  await openToast({
    body: `{{wallet}}\u00A0 has returned an error`,
    timer:
      response.errorResponse.errorType === BeaconErrorType.ABORTED_ERROR
        ? SUCCESS_TIMER
        : undefined,
    state: 'finished',
    walletInfo: response.walletInfo,
    actions
  })
}

/**
 * Show a rate limit reached toast
 */
const showRateLimitReached = async (): Promise<void> => {
  openAlert({
    title: 'Error',
    body: 'Rate limit reached. Please slow down',
    buttons: [{ text: 'Done', style: 'outline' }],
    timer: 3000
  }).catch((toastError) => console.error(toastError))
}

/**
 * Show a "connection successful" alert for 1.5 seconds
 */
const showExtensionConnectedAlert = async (): Promise<void> => {
  await closeAlerts()
}

/**
 * Show a "channel closed" alert for 1.5 seconds
 */
const showChannelClosedAlert = async (): Promise<void> => {
  await openAlert({
    title: 'Channel closed',
    body: `Your peer has closed the connection.`,
    buttons: [{ text: 'Done', style: 'outline' }],
    timer: 1500
  })
}

const showInternalErrorAlert = async (
  data: BeaconEventType[BeaconEvent.INTERNAL_ERROR]
): Promise<void> => {
  const buttons: AlertButton[] = [...(data.buttons ?? [])]

  buttons.push({ text: 'Done', style: 'outline' })

  const alertConfig: AlertConfig = {
    title: 'Internal Error',
    body: data.text,
    buttons
  }
  await openAlert(alertConfig)
}

/**
 * Show a connect alert with QR code
 *
 * @param data The data that is emitted by the PAIR_INIT event
 */
const showPairAlert = async (data: BeaconEventType[BeaconEvent.PAIR_INIT]): Promise<void> => {
  const alertConfig: AlertConfig = {
    title: 'Choose your preferred wallet',
    body: `<p></p>`,
    pairingPayload: {
      p2pSyncCode: data.p2pPeerInfo,
      postmessageSyncCode: data.postmessagePeerInfo,
      preferredNetwork: data.preferredNetwork
    },
    // eslint-disable-next-line @typescript-eslint/unbound-method
    closeButtonCallback: data.abortedHandler,
    disclaimerText: data.disclaimerText
  }
  await openAlert(alertConfig)
}

/**
 * Show a "Permission Granted" alert
 *
 * @param data The data that is emitted by the PERMISSION_REQUEST_SUCCESS event
 */
const showPermissionSuccessAlert = async (
  data: BeaconEventType[BeaconEvent.PERMISSION_REQUEST_SUCCESS]
): Promise<void> => {
  const { output } = data

  await openToast({
    body: `{{wallet}}\u00A0 has granted permission`,
    timer: SUCCESS_TIMER,
    walletInfo: data.walletInfo,
    state: 'finished',
    actions: [
      {
        text: 'Address',
        actionText: shortenString(output.address),
        isBold: true
      },
      {
        text: 'Network',
        actionText: `${output.network.type}`
      },
      {
        text: 'Permissions',
        actionText: output.scopes.join(', ')
      }
    ]
  })
}

/**
 * Show an "Operation Broadcasted" alert
 *
 * @param data The data that is emitted by the OPERATION_REQUEST_SUCCESS event
 */
const showOperationSuccessAlert = async (
  data: BeaconEventType[BeaconEvent.OPERATION_REQUEST_SUCCESS]
): Promise<void> => {
  const { account, output, blockExplorer } = data

  await openToast({
    body: `{{wallet}}\u00A0 successfully submitted operation`,
    timer: SUCCESS_TIMER,
    state: 'finished',
    walletInfo: data.walletInfo,
    actions: [
      {
        text: shortenString(output.transactionHash),
        isBold: true,
        actionText: `Open Blockexplorer`,
        actionLogo: 'external',
        actionCallback: async (): Promise<void> => {
          const link: string = await blockExplorer.getTransactionLink(
            output.transactionHash,
            account.network
          )
          window.open(link, '_blank')
          await closeToast()
        }
      }
    ]
  })
}

/**
 * Show a "Transaction Signed" alert
 *
 * @param data The data that is emitted by the SIGN_REQUEST_SUCCESS event
 */
const showSignSuccessAlert = async (
  data: BeaconEventType[BeaconEvent.SIGN_REQUEST_SUCCESS]
): Promise<void> => {
  const output = data.output
  await openToast({
    body: `{{wallet}}\u00A0 successfully signed payload`,
    timer: SUCCESS_TIMER,
    state: 'finished',
    walletInfo: data.walletInfo,
    actions: [
      {
        text: `Signature: ${shortenString(output.signature)}`,
        actionText: 'Copy to clipboard',
        actionCallback: async (): Promise<void> => {
          navigator.clipboard.writeText(output.signature).then(
            () => {
              logger.log('showSignSuccessAlert', 'Copying to clipboard was successful!')
            },
            (err) => {
              logger.error('showSignSuccessAlert', 'Could not copy text to clipboard: ', err)
            }
          )
          await closeToast()
        }
      }
    ]
  })
}

/**
 * Show a "Transaction Signed" alert
 *
 * @param data The data that is emitted by the ENCRYPT_REQUEST_SUCCESS event
 */
// TODO: ENCRYPTION
// const showEncryptSuccessAlert = async (
//   data: BeaconEventType[BeaconEvent.ENCRYPT_REQUEST_SUCCESS]
// ): Promise<void> => {
//   const output = data.output
//   await openToast({
//     body: `{{wallet}}\u00A0 successfully ${
//       data.output.cryptoOperation === EncryptionOperation.ENCRYPT ? 'encrypted' : 'decrypted'
//     } payload`,
//     timer: SUCCESS_TIMER,
//     state: 'finished',
//     walletInfo: data.walletInfo,
//     actions: [
//       {
//         text: `Payload: <strong>${shortenString(output.payload)}</strong>`,
//         actionText: 'Copy to clipboard',
//         actionCallback: async (): Promise<void> => {
//           navigator.clipboard.writeText(output.payload).then(
//             () => {
//               logger.log('showSignSuccessAlert', 'Copying to clipboard was successful!')
//             },
//             (err) => {
//               logger.error('showSignSuccessAlert', 'Could not copy text to clipboard: ', err)
//             }
//           )
//           await closeToast()
//         }
//       }
//     ]
//   })
// }

/**
 * Show a "Broadcasted" alert
 *
 * @param data The data that is emitted by the BROADCAST_REQUEST_SUCCESS event
 */
const showBroadcastSuccessAlert = async (
  data: BeaconEventType[BeaconEvent.BROADCAST_REQUEST_SUCCESS]
): Promise<void> => {
  const { network, output, blockExplorer } = data

  await openToast({
    body: `{{wallet}}\u00A0 successfully injected operation`,
    timer: SUCCESS_TIMER,
    state: 'finished',
    walletInfo: data.walletInfo,
    actions: [
      {
        text: shortenString(output.transactionHash),
        isBold: true,
        actionText: `Open Blockexplorer`,
        actionLogo: 'external',
        actionCallback: async (): Promise<void> => {
          const link: string = await blockExplorer.getTransactionLink(
            output.transactionHash,
            network
          )
          window.open(link, '_blank')
          await closeToast()
        }
      }
    ]
  })
}

const emptyHandler = (): BeaconEventHandlerFunction => async (): Promise<void> => {
  //
}

export type BeaconEventHandlerFunction<T = unknown> = (
  data: T,
  eventCallback?: AlertButton[]
) => void | Promise<void>

/**
 * The default event handlers
 */
export const defaultEventCallbacks: {
  [key in BeaconEvent]: BeaconEventHandlerFunction<BeaconEventType[key]>
} = {
  [BeaconEvent.PERMISSION_REQUEST_SENT]: showSentToast,
  [BeaconEvent.PERMISSION_REQUEST_SUCCESS]: showPermissionSuccessAlert,
  [BeaconEvent.PERMISSION_REQUEST_ERROR]: showErrorToast,
  [BeaconEvent.OPERATION_REQUEST_SENT]: showSentToast,
  [BeaconEvent.OPERATION_REQUEST_SUCCESS]: showOperationSuccessAlert,
  [BeaconEvent.OPERATION_REQUEST_ERROR]: showErrorToast,
  [BeaconEvent.SIGN_REQUEST_SENT]: showSentToast,
  [BeaconEvent.SIGN_REQUEST_SUCCESS]: showSignSuccessAlert,
  [BeaconEvent.SIGN_REQUEST_ERROR]: showErrorToast,
  // TODO: ENCRYPTION
  // [BeaconEvent.ENCRYPT_REQUEST_SENT]: showSentToast,
  // [BeaconEvent.ENCRYPT_REQUEST_SUCCESS]: showEncryptSuccessAlert,
  // [BeaconEvent.ENCRYPT_REQUEST_ERROR]: showErrorToast,
  [BeaconEvent.BROADCAST_REQUEST_SENT]: showSentToast,
  [BeaconEvent.BROADCAST_REQUEST_SUCCESS]: showBroadcastSuccessAlert,
  [BeaconEvent.BROADCAST_REQUEST_ERROR]: showErrorToast,
  [BeaconEvent.ACKNOWLEDGE_RECEIVED]: showAcknowledgedToast,
  [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: showRateLimitReached,
  [BeaconEvent.NO_PERMISSIONS]: showNoPermissionAlert,
  [BeaconEvent.ACTIVE_ACCOUNT_SET]: emptyHandler(),
  [BeaconEvent.ACTIVE_TRANSPORT_SET]: emptyHandler(),
  [BeaconEvent.SHOW_PREPARE]: showPrepare,
  [BeaconEvent.HIDE_UI]: hideUI,
  [BeaconEvent.PAIR_INIT]: showPairAlert,
  [BeaconEvent.PAIR_SUCCESS]: showExtensionConnectedAlert,
  [BeaconEvent.CHANNEL_CLOSED]: showChannelClosedAlert,
  [BeaconEvent.INTERNAL_ERROR]: showInternalErrorAlert,
  [BeaconEvent.UNKNOWN]: emptyHandler()
}

/**
 * @internalapi
 *
 * Handles beacon events
 */
export class BeaconEventHandler {
  private readonly callbackMap: {
    [key in BeaconEvent]: BeaconEventHandlerFunction<any>[] // TODO: Fix type
  } = {
    [BeaconEvent.PERMISSION_REQUEST_SENT]: [defaultEventCallbacks.PERMISSION_REQUEST_SENT],
    [BeaconEvent.PERMISSION_REQUEST_SUCCESS]: [defaultEventCallbacks.PERMISSION_REQUEST_SUCCESS],
    [BeaconEvent.PERMISSION_REQUEST_ERROR]: [defaultEventCallbacks.PERMISSION_REQUEST_ERROR],
    [BeaconEvent.OPERATION_REQUEST_SENT]: [defaultEventCallbacks.OPERATION_REQUEST_SENT],
    [BeaconEvent.OPERATION_REQUEST_SUCCESS]: [defaultEventCallbacks.OPERATION_REQUEST_SUCCESS],
    [BeaconEvent.OPERATION_REQUEST_ERROR]: [defaultEventCallbacks.OPERATION_REQUEST_ERROR],
    [BeaconEvent.SIGN_REQUEST_SENT]: [defaultEventCallbacks.SIGN_REQUEST_SENT],
    [BeaconEvent.SIGN_REQUEST_SUCCESS]: [defaultEventCallbacks.SIGN_REQUEST_SUCCESS],
    [BeaconEvent.SIGN_REQUEST_ERROR]: [defaultEventCallbacks.SIGN_REQUEST_ERROR],
    // TODO: ENCRYPTION
    // [BeaconEvent.ENCRYPT_REQUEST_SENT]: [defaultEventCallbacks.ENCRYPT_REQUEST_SENT],
    // [BeaconEvent.ENCRYPT_REQUEST_SUCCESS]: [defaultEventCallbacks.ENCRYPT_REQUEST_SUCCESS],
    // [BeaconEvent.ENCRYPT_REQUEST_ERROR]: [defaultEventCallbacks.ENCRYPT_REQUEST_ERROR],
    [BeaconEvent.BROADCAST_REQUEST_SENT]: [defaultEventCallbacks.BROADCAST_REQUEST_SENT],
    [BeaconEvent.BROADCAST_REQUEST_SUCCESS]: [defaultEventCallbacks.BROADCAST_REQUEST_SUCCESS],
    [BeaconEvent.BROADCAST_REQUEST_ERROR]: [defaultEventCallbacks.BROADCAST_REQUEST_ERROR],
    [BeaconEvent.ACKNOWLEDGE_RECEIVED]: [defaultEventCallbacks.ACKNOWLEDGE_RECEIVED],
    [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: [defaultEventCallbacks.LOCAL_RATE_LIMIT_REACHED],
    [BeaconEvent.NO_PERMISSIONS]: [defaultEventCallbacks.NO_PERMISSIONS],
    [BeaconEvent.ACTIVE_ACCOUNT_SET]: [defaultEventCallbacks.ACTIVE_ACCOUNT_SET],
    [BeaconEvent.ACTIVE_TRANSPORT_SET]: [defaultEventCallbacks.ACTIVE_TRANSPORT_SET],
    [BeaconEvent.SHOW_PREPARE]: [defaultEventCallbacks.SHOW_PREPARE],
    [BeaconEvent.HIDE_UI]: [defaultEventCallbacks.HIDE_UI],
    [BeaconEvent.PAIR_INIT]: [defaultEventCallbacks.PAIR_INIT],
    [BeaconEvent.PAIR_SUCCESS]: [defaultEventCallbacks.PAIR_SUCCESS],
    [BeaconEvent.CHANNEL_CLOSED]: [defaultEventCallbacks.CHANNEL_CLOSED],
    [BeaconEvent.INTERNAL_ERROR]: [defaultEventCallbacks.INTERNAL_ERROR],
    [BeaconEvent.UNKNOWN]: [defaultEventCallbacks.UNKNOWN]
  }

  constructor(
    eventsToOverride: {
      [key in BeaconEvent]?: {
        handler: BeaconEventHandlerFunction<BeaconEventType[key]>
      }
    } = {},
    overrideAll?: boolean
  ) {
    if (overrideAll) {
      this.setAllHandlers()
    }
    this.overrideDefaults(eventsToOverride)
  }

  /**
   * A method to subscribe to a specific beacon event and register a callback
   *
   * @param event The event being emitted
   * @param eventCallback The callback that will be invoked
   */
  public async on<K extends BeaconEvent>(
    event: K,
    eventCallback: BeaconEventHandlerFunction<BeaconEventType[K]>
  ): Promise<void> {
    const listeners = this.callbackMap[event] || []
    listeners.push(eventCallback)
    this.callbackMap[event] = listeners
  }

  /**
   * Emit a beacon event
   *
   * @param event The event being emitted
   * @param data The data to be emit
   */
  public async emit<K extends BeaconEvent>(
    event: K,
    data?: BeaconEventType[K],
    eventCallback?: AlertButton[]
  ): Promise<void> {
    const listeners = this.callbackMap[event]
    if (listeners && listeners.length > 0) {
      listeners.forEach(async (listener: BeaconEventHandlerFunction) => {
        try {
          await listener(data, eventCallback)
        } catch (listenerError) {
          logger.error(`error handling event ${event}`, listenerError)
        }
      })
    }
  }

  /**
   * Override beacon event default callbacks. This can be used to disable default alert/toast behaviour
   *
   * @param eventsToOverride An object with the events to override
   */
  private overrideDefaults(eventsToOverride: {
    [key in BeaconEvent]?: {
      handler: BeaconEventHandlerFunction<BeaconEventType[key]>
    }
  }): void {
    Object.keys(eventsToOverride).forEach((untypedEvent: string) => {
      const eventType: BeaconEvent = untypedEvent as BeaconEvent
      const event = eventsToOverride[eventType]
      if (event) {
        this.callbackMap[eventType] = [event.handler]
      }
    })
  }

  /**
   * Set all event callbacks to a specific handler.
   */
  private setAllHandlers(handler?: BeaconEventHandlerFunction): void {
    Object.keys(this.callbackMap).forEach((untypedEvent: string) => {
      const eventType: BeaconEvent = untypedEvent as BeaconEvent
      this.callbackMap[eventType] = []
      if (handler) {
        this.callbackMap[eventType].push(handler)
      } else {
        this.callbackMap[eventType].push((...data) => {
          logger.log(untypedEvent, ...data)
        })
      }
    })
  }
}
