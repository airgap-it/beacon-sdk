export * from '@mavrykdynamics/beacon-core'
export * from '@mavrykdynamics/beacon-transport-matrix'
export * from '@mavrykdynamics/beacon-transport-postmessage'
export * from '@mavrykdynamics/beacon-types'
export * from '@mavrykdynamics/beacon-utils'
export * from '@mavrykdynamics/beacon-ui'

import { DAppClient } from './dapp-client/DAppClient'
import { DAppClientOptions } from './dapp-client/DAppClientOptions'
import { BeaconEvent, BeaconEventHandler, defaultEventCallbacks } from './events'
import { BlockExplorer } from './utils/block-explorer'
import { TzktBlockExplorer } from './utils/tzkt-blockexplorer'
import { getDAppClientInstance } from './utils/get-instance'

export { DAppClient, DAppClientOptions, getDAppClientInstance }

// Events
export { BeaconEvent, BeaconEventHandler, defaultEventCallbacks }

// BlockExplorer
export { BlockExplorer, TzktBlockExplorer, TzktBlockExplorer as TezblockBlockExplorer }
