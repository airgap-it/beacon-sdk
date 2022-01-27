export * from '@airgap/beacon-core'
export * from '@airgap/beacon-transport-matrix'
export * from '@airgap/beacon-transport-postmessage'
export * from '@airgap/beacon-types'
export * from '@airgap/beacon-utils'

import { DAppClient } from './dapp-client/DAppClient'
import { DAppClientOptions } from './dapp-client/DAppClientOptions'
import { BeaconEvent, BeaconEventHandler, defaultEventCallbacks } from './events'
import { Pairing } from './ui/alert/Pairing'
import { BlockExplorer } from './utils/block-explorer'
import { TezblockBlockExplorer } from './utils/tezblock-blockexplorer'
import { openAlert, AlertButton, AlertConfig, closeAlerts } from './ui/alert/Alert'
import { closeToast, openToast, ToastAction } from './ui/toast/Toast'

export { DAppClient, DAppClientOptions, Pairing }

// Events
export { BeaconEvent, BeaconEventHandler, defaultEventCallbacks }

// BlockExplorer
export { BlockExplorer, TezblockBlockExplorer }

// UI
export { openAlert, AlertButton, AlertConfig, closeAlerts, closeToast, openToast, ToastAction }
