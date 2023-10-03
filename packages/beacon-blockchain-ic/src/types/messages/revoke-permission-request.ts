import { BlockchainRequestV3 } from '@airgap/beacon-types'

import { ICPermissionScope } from '../permission-scope'
import { JsonRPCRequest } from './request'
import { ICBlockchainIdentifier } from '../blockchain'

interface ICRevokePermissionRequestParams {
    version: string
    scopes?: ICPermissionScope[]
}

export type ICRevokePermissionRequest = JsonRPCRequest<'revoke_permission', ICRevokePermissionRequestParams>

export interface ICRevokePermissionBeaconRequest extends BlockchainRequestV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'revoke_permission_request'
        scope: 'revoke_permission'
        version: string
        scopes?: ICPermissionScope[]
    }
}