import { Storage } from '../..'
import { BeaconEvent, BeaconEventHandlerFunction } from '../../events'

export interface ClientOptions {
  name: string
  storage: Storage
  eventHandlers?: {
    [key in BeaconEvent]: {
      handler: BeaconEventHandlerFunction
    }
  }
}
