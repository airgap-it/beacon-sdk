import { BlockchainResponseV3 } from '@airgap/beacon-types'

import { ICPermissionScope } from '../permission-scope'
import { ICBlockchainIdentifier } from '../blockchain'
import { JsonRPCResponse } from './response'

interface ICRevokePermissionResponseParams {
    version: string
    scopes?: ICPermissionScope[]
}

export type ICRevokePermissionResponse = JsonRPCResponse<ICRevokePermissionResponseParams>

export interface ICRevokePermissionBeaconResponse extends BlockchainResponseV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'revoke_permission_response'
        version: string
        scopes: ICPermissionScope[]
    }
}