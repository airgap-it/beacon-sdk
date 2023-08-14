import { AppMetadata, PermissionRequestV3 } from '@airgap/beacon-types'

import { ICPermissionScope } from '../permission-scope'
import { ICNetwork } from '../network'
import { ICBlockchainIdentifier } from '../blockchain'
import { JsonRPCRequest } from './request'

interface ICPermissionRequestParams {
    version: string
    appMetadata: AppMetadata
    networks: ICNetwork[]
    scopes: ICPermissionScope[]
    challenge: string
}

export type ICPermissionRequest = JsonRPCRequest<'permission', ICPermissionRequestParams>

export interface ICPermissionBeaconRequest extends PermissionRequestV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'permission_request'
        version: string
        appMetadata: AppMetadata
        networks: ICNetwork[]
        scopes: ICPermissionScope[]
        challenge: string
    }
}