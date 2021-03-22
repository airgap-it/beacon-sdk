import { Network } from '..'

/**
 * @category DApp
 */
export interface RequestBroadcastInput {
  network?: Network
  signedTransaction: string
}
