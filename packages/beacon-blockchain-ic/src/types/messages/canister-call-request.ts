import { BlockchainRequestV3 } from '@airgap/beacon-types'

import { ICBlockchainIdentifier } from '../blockchain'
import { ICPermissionScope } from '../permission-scope'

export interface ICCanisterCallRequest extends BlockchainRequestV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'canister_call_request'
        scope: ICPermissionScope.CANISTER_CALL
        canisterId: string
        method: string
        args: string
    }
}