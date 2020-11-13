import { Storage } from '../..'
import { BeaconEvent, BeaconEventType, BeaconEventHandlerFunction } from '../../events'
import { BlockExplorer } from '../../utils/block-explorer'

export interface DAppClientOptions {
  /**
   * Name of the application
   */
  name: string
  /**
   * A URL to the icon of the applications
   */
  iconUrl?: string
  /**
   * The storage that will be used by the SDK
   */
  storage?: Storage
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

  /**
   * The block explorer used by the SDK
   */
  blockExplorer?: BlockExplorer
}
