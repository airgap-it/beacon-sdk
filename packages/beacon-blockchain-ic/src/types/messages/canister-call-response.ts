import { BlockchainMessage } from '@airgap/beacon-types'

import { ICBlockchainIdentifier } from '../blockchain'
import { ICNetwork } from '../network'

export interface ICCanisterCallResponse extends BlockchainMessage<ICBlockchainIdentifier> {
    network: ICNetwork
    canisterId: string
    method: string
    args: string
    response: string
}