import { Storage } from '../..'
import { BeaconEvent, BeaconEventHandlerFunction, BeaconEventType } from '../../events'

export interface ClientOptions {
  /**
   * Name of the application
   */
  name: string
  /**
   * The storage that will be used by the SDK
   */
  storage: Storage
  /**
   * An object that will be used to overwrite default event handler behaviour
   */
  eventHandlers?: {
    [key in BeaconEvent]?: {
      handler: BeaconEventHandlerFunction<BeaconEventType[key]>
    }
  }
  /**
   * A list of matrix nodes the application can use to connect to
   */
  matrixNodes?: []
}
