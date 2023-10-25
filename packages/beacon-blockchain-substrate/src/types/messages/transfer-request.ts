import { BlockchainMessage } from '/beacon-types'
import { SubstrateMessageType } from '../message-type'
import { SubstratePermissionScope } from '../permission-scope'

export interface SubstrateTransferRequest extends BlockchainMessage<'substrate'> {
  blockchainData: {
    type: SubstrateMessageType.transfer_request
    scope: SubstratePermissionScope.transfer
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
