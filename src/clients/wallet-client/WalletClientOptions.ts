import { Storage } from '../..'

export interface WalletClientOptions {
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
   * A list of matrix nodes the application can use to connect to
   */
  matrixNodes?: string[]
}
