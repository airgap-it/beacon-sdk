import { BlockchainMessage, BeaconMessageType } from '@airgap/beacon-types'
import { DekuMessageType } from '../message-type'
import { DekuPermissionScope } from '../permission-scope'

export interface DekuTransferRequest extends BlockchainMessage<'deku'> {
  blockchainIdentifier: 'deku'
  type: BeaconMessageType.BlockchainRequest
  blockchainData: {
    type: DekuMessageType.transfer_request
    scope: DekuPermissionScope.transfer
    sourceAddress: string
    amount: string
    recipient: string
    mode: 'submit' | 'submit-and-return' | 'return'
    ticketer: string
    data: string
    options: {
      nonce?: number
      level?: number
    }
  }
}
