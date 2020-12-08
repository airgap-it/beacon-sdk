import { Storage } from '../..'

export interface WalletClientOptions {
  /**
   * Name of the application
   */
  name: string
  /**
   * The storage that will be used by the SDK
   */
  storage?: Storage
  /**
   * A list of matrix nodes the application can use to connect to
   */
  matrixNodes?: []
}
