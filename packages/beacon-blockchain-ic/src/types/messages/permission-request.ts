import { AppMetadata, PermissionRequestV3 } from '@airgap/beacon-types'

import { ICPermissionScope } from '../permission-scope'
import { ICNetwork } from '../network'
import { ICBlockchainIdentifier } from '../blockchain'

export interface ICPermissionRequest extends PermissionRequestV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'permission_request'
        appMetadata: AppMetadata
        networks: ICNetwork[]
        scopes: ICPermissionScope[]
    }
}