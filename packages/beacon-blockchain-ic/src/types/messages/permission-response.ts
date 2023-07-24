import { AppMetadata, PermissionResponseV3 } from '@airgap/beacon-types'

import { ICNetwork } from '../network'
import { ICPermissionScope } from '../permission-scope'
import { ICAccount } from '../account'
import { ICBlockchainIdentifier } from '../blockchain'

export interface ICPermissionResponse extends PermissionResponseV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'permission_response'
        appMetadata: AppMetadata
        networks: ICNetwork[]
        scopes: ICPermissionScope[]
        account: ICAccount
    }
}