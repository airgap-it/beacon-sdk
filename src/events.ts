import { openAlert, AlertButton, AlertConfig } from './alert/Alert'
import { openToast } from './alert/Toast'
import { ExtendedP2PPairingResponse } from './types/P2PPairingResponse'
import { PostMessagePairingRequest } from './types/PostMessagePairingRequest'
import { ExtendedPostMessagePairingResponse } from './types/PostMessagePairingResponse'
import { BlockExplorer } from './utils/block-explorer'
import { Logger } from './utils/Logger'
import { Serializer } from './Serializer'
import {
  P2PPairingRequest,
  AccountInfo,
  ErrorResponse,
  UnknownBeaconError,
  PermissionResponseOutput,
  OperationResponseOutput,
  BroadcastResponseOutput,
  SignPayloadResponseOutput,
  Network,
  BeaconError,
  ConnectionContext,
  Transport,
  NetworkType
} from '.'

const logger = new Logger('BeaconEvents')
const serializer = new Serializer()

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
  BROADCAST_REQUEST_SENT = 'BROADCAST_REQUEST_SENT',
  BROADCAST_REQUEST_SUCCESS = 'BROADCAST_REQUEST_SUCCESS',
  BROADCAST_REQUEST_ERROR = 'BROADCAST_REQUEST_ERROR',

  LOCAL_RATE_LIMIT_REACHED = 'LOCAL_RATE_LIMIT_REACHED',

  NO_PERMISSIONS = 'NO_PERMISSIONS',

  ACTIVE_ACCOUNT_SET = 'ACTIVE_ACCOUNT_SET',

  ACTIVE_TRANSPORT_SET = 'ACTIVE_TRANSPORT_SET',

  PAIR_INIT = 'PAIR_INIT',
  PAIR_SUCCESS = 'PAIR_SUCCESS',
  CHANNEL_CLOSED = 'CHANNEL_CLOSED',

  P2P_CHANNEL_CONNECT_SUCCESS = 'P2P_CHANNEL_CONNECT_SUCCESS',
  P2P_LISTEN_FOR_CHANNEL_OPEN = 'P2P_LISTEN_FOR_CHANNEL_OPEN',

  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * The type of the payload of the different BeaconEvents
 */
export interface BeaconEventType {
  [BeaconEvent.PERMISSION_REQUEST_SENT]: undefined
  [BeaconEvent.PERMISSION_REQUEST_SUCCESS]: {
    account: AccountInfo
    output: PermissionResponseOutput
    blockExplorer: BlockExplorer
    connectionContext: ConnectionContext
  }
  [BeaconEvent.PERMISSION_REQUEST_ERROR]: ErrorResponse
  [BeaconEvent.OPERATION_REQUEST_SENT]: undefined
  [BeaconEvent.OPERATION_REQUEST_SUCCESS]: {
    account: AccountInfo
    output: OperationResponseOutput
    blockExplorer: BlockExplorer
    connectionContext: ConnectionContext
  }
  [BeaconEvent.OPERATION_REQUEST_ERROR]: ErrorResponse
  [BeaconEvent.SIGN_REQUEST_SENT]: undefined
  [BeaconEvent.SIGN_REQUEST_SUCCESS]: {
    output: SignPayloadResponseOutput
    connectionContext: ConnectionContext
  }
  [BeaconEvent.SIGN_REQUEST_ERROR]: ErrorResponse
  [BeaconEvent.BROADCAST_REQUEST_SENT]: undefined
  [BeaconEvent.BROADCAST_REQUEST_SUCCESS]: {
    network: Network
    output: BroadcastResponseOutput
    blockExplorer: BlockExplorer
    connectionContext: ConnectionContext
  }
  [BeaconEvent.BROADCAST_REQUEST_ERROR]: ErrorResponse
  [BeaconEvent.PERMISSION_REQUEST_SENT]: undefined
  [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: undefined
  [BeaconEvent.NO_PERMISSIONS]: undefined
  [BeaconEvent.ACTIVE_ACCOUNT_SET]: AccountInfo
  [BeaconEvent.ACTIVE_TRANSPORT_SET]: Transport
  [BeaconEvent.PAIR_INIT]: {
    p2pPeerInfo: P2PPairingRequest
    postmessagePeerInfo: PostMessagePairingRequest
    preferredNetwork: NetworkType
    abortedHandler?(): void
  }
  [BeaconEvent.PAIR_SUCCESS]: ExtendedPostMessagePairingResponse | ExtendedP2PPairingResponse
  [BeaconEvent.P2P_CHANNEL_CONNECT_SUCCESS]: P2PPairingRequest
  [BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]: P2PPairingRequest
  [BeaconEvent.CHANNEL_CLOSED]: string
  [BeaconEvent.INTERNAL_ERROR]: string
  [BeaconEvent.UNKNOWN]: undefined
}

/**
 * Show a "Request sent" toast
 */
const showSentToast = async (): Promise<void> => {
  openToast({
    body:
      /** TODO: Request Sent */
      'Request sent to <img class="beacon-toast__content__img" src="https://thanoswallet.com/logo.png"> <strong>Thanos</strong>',
    /** TODO: Wallet Acknowledged
     * 'Awaiting confirmation in <img class="beacon-toast__content__img" src="https://thanoswallet.com/logo.png"> <strong>Thanos</strong>',*/
    /** TODO: Permission granted 
      '<img class="beacon-toast__content__img" src="https://thanoswallet.com/logo.png"> <strong>Thanos</strong>&nbsphas granted permission',*/
    /** TODO: Operation broadcasted 
      '<img class="beacon-toast__content__img" src="https://thanoswallet.com/logo.png"> <strong>Thanos</strong>&nbspsuccessfully submitted operation',*/
    timer: 1000000
  }).catch((toastError) => console.error(toastError))
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
 * Show an error alert
 *
 * @param beaconError The beacon error
 */
const showErrorAlert = async (
  beaconError: ErrorResponse,
  buttons?: AlertButton[]
): Promise<void> => {
  const error = beaconError.errorType
    ? BeaconError.getError(beaconError.errorType, beaconError.errorData)
    : new UnknownBeaconError()

  await openAlert({
    title: error.title,
    body: error.description,
    buttons
  })
}

/**
 * Show a rate limit reached toast
 */
const showRateLimitReached = async (): Promise<void> => {
  openToast({
    body: 'Rate limit reached. Please slow down',
    timer: 3000
  }).catch((toastError) => console.error(toastError))
}

/**
 * Show a "connection successful" alert for 1.5 seconds
 */
const showBeaconConnectedAlert = async (): Promise<void> => {
  await openAlert({
    title: 'Success',
    body: 'A wallet has been paired over the beacon network.',
    buttons: [{ text: 'Done', style: 'outline' }],
    timer: 1500
  })
}

/**
 * Show a "connection successful" alert for 1.5 seconds
 */
const showExtensionConnectedAlert = async (): Promise<void> => {
  await openAlert({
    title: 'Success',
    body: 'A wallet has been paired.',
    buttons: [{ text: 'Done', style: 'outline' }],
    timer: 1500
  })
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
  const alertConfig: AlertConfig = {
    title: 'Internal Error',
    body: `${data}`,
    buttons: [{ text: 'Done', style: 'outline' }]
  }
  await openAlert(alertConfig)
}

/**
 * Show a connect alert with QR code
 *
 * @param data The data that is emitted by the P2P_LISTEN_FOR_CHANNEL_OPEN event
 */
const showQrAlert = async (
  data: BeaconEventType[BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]
): Promise<void> => {
  const dataString = JSON.stringify(data)
  console.log(dataString) // TODO: Remove after "copy to clipboard" has been added.

  const base58encoded = await serializer.serialize(data)
  console.log(base58encoded) // TODO: Remove after "copy to clipboard" has been added.

  const alertConfig: AlertConfig = {
    title: 'Choose your preferred wallet',
    body: `<p></p>`,
    pairingPayload: {
      p2pSyncCode: base58encoded,
      postmessageSyncCode: base58encoded,
      preferredNetwork: NetworkType.MAINNET
    }
  }
  await openAlert(alertConfig)
}

/**
 * Show a connect alert with QR code
 *
 * @param data The data that is emitted by the PAIR_INIT event
 */
const showPairAlert = async (data: BeaconEventType[BeaconEvent.PAIR_INIT]): Promise<void> => {
  const p2pBase58encoded = await serializer.serialize(data.p2pPeerInfo)
  const postmessageBase58encoded = await serializer.serialize(data.postmessagePeerInfo)

  const alertConfig: AlertConfig = {
    title: 'Choose your preferred wallet',
    body: `<p></p>`,
    pairingPayload: {
      p2pSyncCode: p2pBase58encoded,
      postmessageSyncCode: postmessageBase58encoded,
      preferredNetwork: data.preferredNetwork
    },
    // eslint-disable-next-line @typescript-eslint/unbound-method
    closeButtonCallback: data.abortedHandler
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
  const { account, output, blockExplorer } = data
  const alertConfig: AlertConfig = {
    title: 'Permission Granted',
    body: `We received permissions for the address <strong>${output.address}</strong>
    <br>
    <br>
    Network: <strong>${output.network.type}</strong>
    <br>
    Permissions: <strong>${output.scopes}</strong>`,
    buttons: [
      {
        text: 'Open Blockexplorer',
        actionCallback: async (): Promise<void> => {
          const link: string = await blockExplorer.getAddressLink(output.address, account.network)
          window.open(link, '_blank')
        }
      },
      { text: 'Done', style: 'solid' }
    ]
  }
  await openAlert(alertConfig)
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
  const alertConfig: AlertConfig = {
    title: 'Operation Broadcasted',
    body: `The transaction has successfully been broadcasted to the network with the following hash. <strong>${output.transactionHash}</strong>`,
    buttons: [
      {
        text: 'Open Blockexplorer',
        actionCallback: async (): Promise<void> => {
          const link: string = await blockExplorer.getTransactionLink(
            output.transactionHash,
            account.network
          )
          window.open(link, '_blank')
        }
      },
      { text: 'Done', style: 'solid' }
    ]
  }
  await openAlert(alertConfig)
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
  const alertConfig: AlertConfig = {
    title: 'Payload signed',
    body: `The payload has successfully been signed.
    <br>
    Signature: <strong>${output.signature}</strong>`,
    buttons: [{ text: 'Done', style: 'solid' }]
  }
  await openAlert(alertConfig)
}

/**
 * Show a "Broadcasted" alert
 *
 * @param data The data that is emitted by the BROADCAST_REQUEST_SUCCESS event
 */
const showBroadcastSuccessAlert = async (
  data: BeaconEventType[BeaconEvent.BROADCAST_REQUEST_SUCCESS]
): Promise<void> => {
  const { network, output, blockExplorer } = data
  const alertConfig: AlertConfig = {
    title: 'Broadcasted',
    body: `The transaction has successfully been broadcasted to the network with the following hash. <strong>${output.transactionHash}</strong>`,
    buttons: [
      {
        text: 'Open Blockexplorer',
        actionCallback: async (): Promise<void> => {
          const link: string = await blockExplorer.getTransactionLink(
            output.transactionHash,
            network
          )
          window.open(link, '_blank')
        }
      },
      { text: 'Done', style: 'solid' }
    ]
  }
  await openAlert(alertConfig)
}

const emptyHandler = (eventType: BeaconEvent): BeaconEventHandlerFunction => async (
  data?: unknown
): Promise<void> => {
  logger.log('emptyHandler', eventType, data)
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
  [BeaconEvent.PERMISSION_REQUEST_ERROR]: showErrorAlert,
  [BeaconEvent.OPERATION_REQUEST_SENT]: showSentToast,
  [BeaconEvent.OPERATION_REQUEST_SUCCESS]: showOperationSuccessAlert,
  [BeaconEvent.OPERATION_REQUEST_ERROR]: showErrorAlert,
  [BeaconEvent.SIGN_REQUEST_SENT]: showSentToast,
  [BeaconEvent.SIGN_REQUEST_SUCCESS]: showSignSuccessAlert,
  [BeaconEvent.SIGN_REQUEST_ERROR]: showErrorAlert,
  [BeaconEvent.BROADCAST_REQUEST_SENT]: showSentToast,
  [BeaconEvent.BROADCAST_REQUEST_SUCCESS]: showBroadcastSuccessAlert,
  [BeaconEvent.BROADCAST_REQUEST_ERROR]: showErrorAlert,
  [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: showRateLimitReached,
  [BeaconEvent.NO_PERMISSIONS]: showNoPermissionAlert,
  [BeaconEvent.ACTIVE_ACCOUNT_SET]: emptyHandler(BeaconEvent.ACTIVE_ACCOUNT_SET),
  [BeaconEvent.ACTIVE_TRANSPORT_SET]: emptyHandler(BeaconEvent.ACTIVE_TRANSPORT_SET),
  [BeaconEvent.PAIR_INIT]: showPairAlert,
  [BeaconEvent.PAIR_SUCCESS]: showExtensionConnectedAlert,
  [BeaconEvent.P2P_CHANNEL_CONNECT_SUCCESS]: showBeaconConnectedAlert,
  [BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]: showQrAlert,
  [BeaconEvent.CHANNEL_CLOSED]: showChannelClosedAlert,
  [BeaconEvent.INTERNAL_ERROR]: showInternalErrorAlert,
  [BeaconEvent.UNKNOWN]: emptyHandler(BeaconEvent.UNKNOWN)
}

/**
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
    [BeaconEvent.BROADCAST_REQUEST_SENT]: [defaultEventCallbacks.BROADCAST_REQUEST_SENT],
    [BeaconEvent.BROADCAST_REQUEST_SUCCESS]: [defaultEventCallbacks.BROADCAST_REQUEST_SUCCESS],
    [BeaconEvent.BROADCAST_REQUEST_ERROR]: [defaultEventCallbacks.BROADCAST_REQUEST_ERROR],
    [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: [defaultEventCallbacks.LOCAL_RATE_LIMIT_REACHED],
    [BeaconEvent.NO_PERMISSIONS]: [defaultEventCallbacks.NO_PERMISSIONS],
    [BeaconEvent.ACTIVE_ACCOUNT_SET]: [defaultEventCallbacks.ACTIVE_ACCOUNT_SET],
    [BeaconEvent.ACTIVE_TRANSPORT_SET]: [defaultEventCallbacks.ACTIVE_TRANSPORT_SET],
    [BeaconEvent.PAIR_INIT]: [defaultEventCallbacks.PAIR_INIT],
    [BeaconEvent.PAIR_SUCCESS]: [defaultEventCallbacks.PAIR_SUCCESS],
    [BeaconEvent.P2P_CHANNEL_CONNECT_SUCCESS]: [defaultEventCallbacks.P2P_CHANNEL_CONNECT_SUCCESS],
    [BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]: [defaultEventCallbacks.P2P_LISTEN_FOR_CHANNEL_OPEN],
    [BeaconEvent.CHANNEL_CLOSED]: [defaultEventCallbacks.CHANNEL_CLOSED],
    [BeaconEvent.INTERNAL_ERROR]: [defaultEventCallbacks.INTERNAL_ERROR],
    [BeaconEvent.UNKNOWN]: [defaultEventCallbacks.UNKNOWN]
  }

  constructor(
    eventsToOverride: {
      [key in BeaconEvent]?: {
        handler: BeaconEventHandlerFunction<BeaconEventType[key]>
      }
    } = {}
  ) {
    this.overrideDefaults(eventsToOverride).catch((overrideError: Error) => {
      logger.error('constructor', 'overriding error', overrideError)
    })
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
  private async overrideDefaults(
    eventsToOverride: {
      [key in BeaconEvent]?: {
        handler: BeaconEventHandlerFunction<BeaconEventType[key]>
      }
    }
  ): Promise<void> {
    Object.keys(eventsToOverride).forEach((untypedEvent: string) => {
      const eventType: BeaconEvent = untypedEvent as BeaconEvent
      const event = eventsToOverride[eventType]
      if (event) {
        this.callbackMap[eventType] = [event.handler]
      }
    })
  }
}
