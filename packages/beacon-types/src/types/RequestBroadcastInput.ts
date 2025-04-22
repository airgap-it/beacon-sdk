import { Network } from "./beacon/Network"

/**
 * @category DApp
 */
export interface RequestBroadcastInput {
  /**
   * @deprecated You should now specify the network in the constructor of the DAppClient
   */
  network?: Network
  signedTransaction: string
}
