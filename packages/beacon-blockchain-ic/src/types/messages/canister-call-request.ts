import { BlockchainRequestV3 } from '@airgap/beacon-types'

import { ICBlockchainIdentifier } from '../blockchain'
import { ICPermissionScope } from '../permission-scope'
import { JsonRPCRequest } from './request'
import { ICNetwork } from '../network'

interface ICCanisterCallRequestParams {
    version: string
    network: ICNetwork
    canisterId: string
    sender: string
    method: string
    arg: string
}

export type ICCanisterCallRequest = JsonRPCRequest<'canister_call', ICCanisterCallRequestParams>

export interface ICCanisterCallBeaconRequest extends BlockchainRequestV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'canister_call_request'
        scope: ICPermissionScope.CANISTER_CALL
        version: string
        network: ICNetwork
        canisterId: string
        sender: string
        method: string
        arg: string
    }
}