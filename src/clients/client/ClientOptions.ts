import { Storage } from '../..'
import { BeaconEvent, BeaconEventHandlerFunction, BeaconEventType } from '../../events'

export interface ClientOptions {
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
   * Disable all default Events and UI elements
   */
  disableDefaultEvents?: boolean

  /**
   * A list of matrix nodes the application can use to connect to
   *
   * Only provide the hostname, no https:// prefix, eg. ['matrix.example.com']
   */
  matrixNodes?: string[]
}
