import { Storage, NodeDistributions } from '@mavrykdynamics/beacon-types'

/**
 * @internalapi
 */
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
   * Disable all default Events and UI elements. If passed together with "eventHandlers",
   * the default eventHandlers will be removed, and the ones passed by the user will be added.
   */
  disableDefaultEvents?: boolean

  /**
   * A list of matrix nodes to connect to. If a non-empty array is passed, the default options will be overwritten.
   * One node will be randomly selected based on the local keypair and the other nodes will be used as a fallback in case the primary node goes down.
   *
   * Only provide the hostname, no https:// prefix. Eg. { [Regions.EU1]: ['matrix.example.com'] }
   */
  matrixNodes?: NodeDistributions
}
