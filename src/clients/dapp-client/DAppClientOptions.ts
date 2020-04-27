import { Storage } from '../..'
import { BeaconEvents, BeaconEventHandlerFunction } from '../../events'

export interface DAppClientOptions {
  name: string
  iconUrl?: string
  storage?: Storage
  eventHandlers?: {
    [key in BeaconEvents]: {
      handler: BeaconEventHandlerFunction
    }
  }
}
