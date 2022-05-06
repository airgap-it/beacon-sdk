import { BlockchainMessage } from '@airgap/beacon-types'
import { TezosSaplingMessageType } from '../message-type'
import { TezosSaplingPermissionScope } from '../permission-scope'

export interface TezpsSaplingTransferRequest extends BlockchainMessage<'tezos-sapling'> {
  blockchainData: {
    type: TezosSaplingMessageType.transfer_request
    scope: TezosSaplingPermissionScope.transfer
    sourceAddress: string
    amount: string
    recipient: string
    mode: 'submit' | 'submit-and-return' | 'return' // TODO: Wording
  }
}
