import { Network } from '..'

export interface RequestBroadcastInput {
  network?: Network
  signedTransaction: string
}
