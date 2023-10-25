import { BlockchainMessage } from '@mavrykdynamics/beacon-types'
import { TezosSaplingMessageType } from '../message-type'
import { TezosSaplingPermissionScope } from '../permission-scope'

export interface TezosSaplingTransferRequest extends BlockchainMessage<'tezos-sapling'> {
  blockchainData: {
    type: TezosSaplingMessageType.transfer_request
    scope: TezosSaplingPermissionScope.transfer
    sourceAddress: string
    amount: string
    recipient: string
    // No network required because we can get it from account id
    mode: 'submit' | 'submit-and-return' | 'return' // TODO: Wording
  }
}
