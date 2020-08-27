import { Storage } from '../..'

export interface BeaconClientOptions {
  /**
   * Name of the application
   */
  name: string
  /**
   * The storage that will be used by the SDK
   */
  storage: Storage
}
