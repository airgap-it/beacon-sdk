import { openToast } from './alert/Toast'
import { openAlert, AlertConfig } from './alert/Alert'
import { getQrData } from './utils/qr'
import { Logger } from './utils/Logger'
import { Transport } from './transports/Transport'
import { BeaconError } from './errors/BeaconError'
import { ConnectionContext } from './types/ConnectionContext'
import { Serializer } from './Serializer'
import {
  getAccountBlockExplorerLinkForNetwork,
  getTransactionBlockExplorerLinkForNetwork
} from './utils/block-explorer'
import {
  P2PPairInfo,
  AccountInfo,
  BeaconErrorMessage,
  UnknownBeaconError,
  PermissionResponseOutput,
  OperationResponseOutput,
  BroadcastResponseOutput,
  SignPayloadResponseOutput,
  Network
} from '.'

const logger = new Logger('BeaconEvents')
const serializer = new Serializer()

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

  P2P_CHANNEL_CONNECT_SUCCESS = 'P2P_CHANNEL_CONNECT_SUCCESS',
  P2P_LISTEN_FOR_CHANNEL_OPEN = 'P2P_LISTEN_FOR_CHANNEL_OPEN',

  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface AlertButton {
  name: ''
  actionCallback(): Promise<void>
}

export interface BeaconEventType {
  [BeaconEvent.PERMISSION_REQUEST_SENT]: undefined
  [BeaconEvent.PERMISSION_REQUEST_SUCCESS]: {
    account: AccountInfo
    output: PermissionResponseOutput
    connectionContext: ConnectionContext
  }
  [BeaconEvent.PERMISSION_REQUEST_ERROR]: BeaconErrorMessage
  [BeaconEvent.OPERATION_REQUEST_SENT]: undefined
  [BeaconEvent.OPERATION_REQUEST_SUCCESS]: {
    account: AccountInfo
    output: OperationResponseOutput
    connectionContext: ConnectionContext
  }
  [BeaconEvent.OPERATION_REQUEST_ERROR]: BeaconErrorMessage
  [BeaconEvent.SIGN_REQUEST_SENT]: undefined
  [BeaconEvent.SIGN_REQUEST_SUCCESS]: {
    output: SignPayloadResponseOutput
    connectionContext: ConnectionContext
  }
  [BeaconEvent.SIGN_REQUEST_ERROR]: BeaconErrorMessage
  [BeaconEvent.BROADCAST_REQUEST_SENT]: undefined
  [BeaconEvent.BROADCAST_REQUEST_SUCCESS]: {
    network: Network
    output: BroadcastResponseOutput
    connectionContext: ConnectionContext
  }
  [BeaconEvent.BROADCAST_REQUEST_ERROR]: BeaconErrorMessage
  [BeaconEvent.PERMISSION_REQUEST_SENT]: undefined
  [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: undefined
  [BeaconEvent.NO_PERMISSIONS]: undefined
  [BeaconEvent.ACTIVE_ACCOUNT_SET]: AccountInfo
  [BeaconEvent.ACTIVE_TRANSPORT_SET]: Transport
  [BeaconEvent.P2P_CHANNEL_CONNECT_SUCCESS]: P2PPairInfo
  [BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]: P2PPairInfo
  [BeaconEvent.INTERNAL_ERROR]: string
  [BeaconEvent.UNKNOWN]: undefined
}

const showSentToast = async (): Promise<void> => {
  openToast({ body: 'Request sent', timer: 3000 }).catch((toastError) => console.error(toastError))
}

const showNoPermissionAlert = async (): Promise<void> => {
  await openAlert({
    title: 'No Permission',
    body: 'Please allow the wallet to handle this type of request.'
  })
}

const showErrorAlert = async (
  beaconError: BeaconErrorMessage,
  buttons?: () => void
): Promise<void> => {
  const error = beaconError.errorType
    ? BeaconError.getError(beaconError.errorType)
    : new UnknownBeaconError()

  console.log('showing error alert type ', beaconError.errorType)
  if (buttons) {
    // eslint-disable-next-line @typescript-eslint/tslint/config
  }

  await openAlert({
    title: error.title,
    body: error.description
  })
}

const showRateLimitReached = async (): Promise<void> => {
  openToast({
    body: 'Rate limit reached. Please slow down',
    timer: 3000
  }).catch((toastError) => console.error(toastError))
}

const showBeaconConnectedAlert = async (): Promise<void> => {
  await openAlert({
    title: 'Success',
    body: 'A wallet has been paired over the beacon network.',
    confirmButtonText: 'Done',
    timer: 1500
  })
}

const showInternalErrorAlert = async (
  data: BeaconEventType[BeaconEvent.INTERNAL_ERROR]
): Promise<void> => {
  const alertConfig: AlertConfig = {
    title: 'Internal Error',
    confirmButtonText: 'Done',
    body: `${data}`,
    confirmCallback: () => undefined
  }
  await openAlert(alertConfig)
}

const showQrCode = async (
  data: BeaconEventType[BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]
): Promise<void> => {
  const dataString = JSON.stringify(data)
  console.log(dataString)

  const alertConfig: AlertConfig = {
    title: 'Pair with Wallet',
    confirmButtonText: 'Done',
    actionButtonText: 'Connect Wallet',
    body: `${getQrData(
      dataString,
      'svg'
    )}<p>Connect wallet by scanning the QR code or clicking the link button <a href="https://docs.walletbeacon.io/supported-wallets.html" target="_blank">Learn&nbsp;more</a></p>`,
    confirmCallback: () => undefined,
    actionCallback: async () => {
      const base58encoded = await serializer.serialize(data)
      const uri = `web+tezos://?type=tzip10&data=${base58encoded}`
      const childWindow = window.open() as Window
      childWindow.opener = null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      childWindow.location = uri as any
    }
  }
  await openAlert(alertConfig)
}

const showPermissionSuccessAlert = async (
  data: BeaconEventType[BeaconEvent.PERMISSION_REQUEST_SUCCESS]
): Promise<void> => {
  const { account, output } = data
  const alertConfig: AlertConfig = {
    title: 'Permission Granted',
    body: `We received permissions for the address <strong>${output.address}</strong>
    <br>
    <br>
    Network: <strong>${output.network.type}</strong>
    <br>
    Permissions: <strong>${output.scopes}</strong>`,
    confirmButtonText: 'Done',
    confirmCallback: () => undefined,
    actionButtonText: 'Open Blockexplorer',
    actionCallback: async () => {
      const link: string = await getAccountBlockExplorerLinkForNetwork(
        account.network,
        output.address
      )
      window.open(link, '_blank')
    }
  }
  await openAlert(alertConfig)
}

const showOperationSuccessAlert = async (
  data: BeaconEventType[BeaconEvent.OPERATION_REQUEST_SUCCESS]
): Promise<void> => {
  const { account, output } = data
  const alertConfig: AlertConfig = {
    title: 'Operation Broadcasted',
    body: `The transaction has successfully been broadcasted to the network with the following hash. <strong>${output.transactionHash}</strong>`,
    confirmButtonText: 'Done',
    confirmCallback: () => undefined,
    actionButtonText: 'Open Blockexplorer',
    actionCallback: async () => {
      const link: string = await getTransactionBlockExplorerLinkForNetwork(
        account.network,
        output.transactionHash
      )
      window.open(link, '_blank')
    }
  }
  await openAlert(alertConfig)
}

const showSignSuccessAlert = async (
  data: BeaconEventType[BeaconEvent.SIGN_REQUEST_SUCCESS]
): Promise<void> => {
  const output = data.output
  const alertConfig: AlertConfig = {
    title: 'Payload signed',
    body: `The payload has successfully been signed.
    <br>
    Signature: <strong>${output.signature}</strong>`,
    confirmButtonText: 'Done',
    confirmCallback: () => undefined
  }
  await openAlert(alertConfig)
}

const showBroadcastSuccessAlert = async (
  data: BeaconEventType[BeaconEvent.BROADCAST_REQUEST_SUCCESS]
): Promise<void> => {
  const { network, output } = data
  const alertConfig: AlertConfig = {
    title: 'Broadcasted',
    body: `The transaction has successfully been broadcasted to the network with the following hash. <strong>${output.transactionHash}</strong>`,
    confirmButtonText: 'Done',
    confirmCallback: () => undefined,
    actionButtonText: 'Open Blockexplorer',
    actionCallback: async () => {
      const link: string = await getTransactionBlockExplorerLinkForNetwork(
        network,
        output.transactionHash
      )
      window.open(link, '_blank')
    }
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
  eventCallback?: () => void
) => void | Promise<void>

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
  [BeaconEvent.P2P_CHANNEL_CONNECT_SUCCESS]: showBeaconConnectedAlert,
  [BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]: showQrCode,
  [BeaconEvent.INTERNAL_ERROR]: showInternalErrorAlert,
  [BeaconEvent.UNKNOWN]: emptyHandler(BeaconEvent.UNKNOWN)
}

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
    [BeaconEvent.P2P_CHANNEL_CONNECT_SUCCESS]: [defaultEventCallbacks.P2P_CHANNEL_CONNECT_SUCCESS],
    [BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]: [defaultEventCallbacks.P2P_LISTEN_FOR_CHANNEL_OPEN],
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
      logger.error('constructor', overrideError)
    })
  }

  public async on<K extends BeaconEvent>(
    event: K,
    eventCallback: BeaconEventHandlerFunction<BeaconEventType[K]>
  ): Promise<void> {
    const listeners = this.callbackMap[event] || []
    listeners.push(eventCallback)
    this.callbackMap[event] = listeners
  }

  public async emit<K extends BeaconEvent>(
    event: K,
    data?: BeaconEventType[K],
    eventCallback?: () => void
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
