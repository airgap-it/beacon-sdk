import { NetworkType, Storage } from '../..'
import { BeaconEvent, BeaconEventType, BeaconEventHandlerFunction } from '../../events'
import { ColorMode } from '../../types/ColorMode'
import { BlockExplorer } from '../../utils/block-explorer'

export interface DAppClientOptions {
  /**
   * Name of the application
   */
  name: string

  /**
   * A URL to the icon of the application
   */
  iconUrl?: string

  /**
   * A URL to the website of the application
   */
  appUrl?: string

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
   * Disable all default Events and UI elements
   */
  disableDefaultEvents?: boolean

  /**
   * A list of matrix nodes the application can use to connect to
   */
  matrixNodes?: string[]

  /**
   * The block explorer used by the SDK
   */
  blockExplorer?: BlockExplorer

  /**
   * Indicates on which network the DApp is planning to run. This is currently used to adjust the URLs of web-wallets in the pairing alert if they use different URLs for testnets.
   */
  preferredNetwork?: NetworkType

  /**
   * Set the color mode for the UI elements (alerts and toasts)
   */
  colorMode?: ColorMode
}
