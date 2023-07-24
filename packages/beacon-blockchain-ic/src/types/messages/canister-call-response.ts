import { BlockchainResponseV3 } from '@airgap/beacon-types'

import { ICBlockchainIdentifier } from '../blockchain'

export interface ICCanisterCallResponse extends BlockchainResponseV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'canister_call_response'
        canisterId: string
        method: string
        args: string
        response: string
    }
}