import { BlockchainMessage } from '@airgap/beacon-types'
import { DekuMessageType } from '../message-type'
import { DekuPermissionScope } from '../permission-scope'

export interface DekuTransferRequest extends BlockchainMessage<'deku'> {
  blockchainData: {
    type: DekuMessageType.transfer_request
    scope: DekuPermissionScope.transfer
    sourceAddress: string
    amount: string
    recipient: string
    network: {
      genesisHash: string
      rpc?: string
    }
    mode: 'submit' | 'submit-and-return' | 'return' // TODO: Wording
  }
}
