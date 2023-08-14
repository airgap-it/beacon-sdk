import { BlockchainResponseV3 } from '@airgap/beacon-types'

import { ICBlockchainIdentifier } from '../blockchain'
import { JsonRPCResponse } from './response'
import { ICNetwork } from '../network'

interface ICCanisterCallResponseParams {
    version: string
    network: ICNetwork
    contentMap: {
        request_type: string
        sender: string
        nonce?: string
        ingress_expiry: string
        canister_id: string
        method_name: string
        arg: string
    }
    certificate: string
}

export type ICCanisterCallResponse = JsonRPCResponse<ICCanisterCallResponseParams>

export interface ICCanisterCallBeaconResponse extends BlockchainResponseV3<ICBlockchainIdentifier> {
    blockchainData: {
        type: 'canister_call_response'
        version: string
        network: ICNetwork
        contentMap: {
            request_type: string
            sender: string
            nonce?: string
            ingress_expiry: string
            canister_id: string
            method_name: string
            arg: string
        }
        certificate: string
    }
}