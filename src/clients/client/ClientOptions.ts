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
   * An object that will be used to overwrite default event handler behaviour.
   *
   * If you plan to overwrite all default events, use "disableDefaultEvents" instead.
   *
   * This will overwrite the default event handler, so this can lead to unexpected behavior in some cases.
   * We recommend that you overwrite all handlers if you want to use your own UI.
   *
   * If you simply want to be notified of events happening, but do not want to overwrite the default behavior,
   * please use `subscribeToEvent()` on the DAppClient instead.
   */
  eventHandlers?: {
    [key in BeaconEvent]?: {
      handler: BeaconEventHandlerFunction<BeaconEventType[key]>
    }
  }

  /**
   * Disable all default Events and UI elements. If passed together with "eventHandlers",
   * the default eventHandlers will be removed, and the ones passed by the user will be added.
   */
  disableDefaultEvents?: boolean

  /**
   * A list of matrix nodes to connect to. If a non-empty array is passed, the default options will be overwritten.
   * One node will be randomly selected based on the local keypair and the other nodes will be used as a fallback in case the primary node goes down.
   *
   * Only provide the hostname, no https:// prefix. Eg. ['matrix.example.com']
   */
  matrixNodes?: string[]
}
