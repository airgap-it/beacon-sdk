import { BlockchainMessage } from '@airgap/beacon-types'

import { ICNetwork } from '../network'
import { ICBlockchainIdentifier } from '../blockchain'

export interface ICCanisterCallRequest extends BlockchainMessage<ICBlockchainIdentifier> {
    network: ICNetwork
    canisterId: string
    method: string
    args: string
}