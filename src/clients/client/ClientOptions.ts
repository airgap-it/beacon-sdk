import { Storage } from '../..'
import { BeaconEvent, BeaconEventHandlerFunction, BeaconEventType } from '../../events'

export interface ClientOptions {
  name: string
  storage: Storage
  eventHandlers?: {
    [key in BeaconEvent]?: {
      handler: BeaconEventHandlerFunction<BeaconEventType[key]>
    }
  }
}
