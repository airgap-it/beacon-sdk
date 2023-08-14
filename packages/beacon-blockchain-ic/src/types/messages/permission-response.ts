import { AppMetadata, PermissionResponseV3 } from '@airgap/beacon-types'

import { ICNetwork } from '../network'
import { ICPermissionScope } from '../permission-scope'
import { ICBlockchainIdentifier } from '../blockchain'
import { JsonRPCResponse } from './response'

interface ICPermissionResponseParams {
    version: string
    appMetadata: AppMetadata
    networks: ICNetwork[]
    scopes: ICPermissionScope[]
    identity: {
        algorithm: 'ed25519' | 'secp256k1' | 'secp256r1'
        publicKey: string
        ledger?: {
            subaccount?: string
        }
    }
    challenge: string
    signature: string
}

export type ICPermissionResponse = JsonRPCResponse<ICPermissionResponseParams>

export interface ICPermissionBeaconResponse extends PermissionResponseV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'permission_response'
        version: string
        appMetadata: AppMetadata
        networks: ICNetwork[]
        scopes: ICPermissionScope[]
        identity: {
            algorithm: 'ed25519' | 'secp256k1' | 'secp256r1'
            publicKey: string
            ledger?: {
                subaccount?: string
            }
        }
        challenge: string
        signature: string
    }
}