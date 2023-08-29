import { BeaconMessageType, DAppClient } from "@airgap/beacon-dapp"
import { WalletClient } from "@airgap/beacon-wallet"

import { ICPermissionBeaconRequest, ICPermissionRequest } from "./types/messages/permission-request"
import { ICPermissionBeaconResponse, ICPermissionResponse } from "./types/messages/permission-response"
import { ICCanisterCallBeaconRequest, ICCanisterCallRequest } from "./types/messages/canister-call-request"
import { ICCanisterCallBeaconResponse, ICCanisterCallResponse } from "./types/messages/canister-call-response"
import { ICPermissionScope } from "./types/permission-scope"
import { JsonRPCError } from "./types/messages/response"
import { BeaconErrorType } from "@airgap/beacon-types"

declare module "@airgap/beacon-dapp" {
    interface DAppClient {
        readonly ic: ICDappClient
    }
}

declare module "@airgap/beacon-wallet" {
    interface WalletClient {
        readonly ic: ICWalletClient
    }
}

class ICDappClient {
    constructor(private readonly client: DAppClient) {}

    public async requestPermissions(parameters: ICPermissionRequest['params']): Promise<ICPermissionResponse> {
        const jsonrpcRequest: ICPermissionRequest = {
            id: new Date().getTime(),
            jsonrpc: '2.0',
            method: 'permission',
            params: {
                ...parameters,
                version: '1'
            }
        }

        const beaconRequest: ICPermissionBeaconRequest = {
            blockchainIdentifier: 'ic',
            type: BeaconMessageType.PermissionRequest,
            blockchainData: {
                type: 'permission_request',
                ...parameters,
            }
        }

        const response: ICPermissionBeaconResponse = (await this.client.permissionRequest(beaconRequest, jsonrpcRequest.id.toString())) as ICPermissionBeaconResponse
        const { type: _, ...result } = response.blockchainData

        const jsonrpcResponse: ICPermissionResponse = {
            id: jsonrpcRequest.id,
            jsonrpc: '2.0',
            result: {
                ...result,
                appMetadata: {
                    name: result.appMetadata.name,
                    url: result.appMetadata.url
                }
            }
        }

        return jsonrpcResponse
    }

    public async requestCanisterCall(parameters: ICCanisterCallRequest['params']): Promise<ICCanisterCallResponse> {
        const jsonrpcRequest: ICCanisterCallRequest = {
            id: new Date().getTime(),
            jsonrpc: '2.0',
            method: 'canister_call',
            params: {
                ...parameters,
                version: '1'
            }
        }

        const beaconRequest: ICCanisterCallBeaconRequest = {
            blockchainIdentifier: 'ic',
            type: BeaconMessageType.BlockchainRequest,
            accountId: (await this.client.getActiveAccount())?.accountIdentifier!,
            blockchainData: {
                type: 'canister_call_request',
                scope: ICPermissionScope.CANISTER_CALL,
                ...parameters,
            }
        }

        const response: ICCanisterCallBeaconResponse = (await this.client.request(beaconRequest, jsonrpcRequest.id.toString())) as ICCanisterCallBeaconResponse
        const { type: _, ...result } = response.blockchainData

        const jsonrpcResponse: ICCanisterCallResponse = {
            id: jsonrpcRequest.id,
            jsonrpc: '2.0',
            result
        }

        return jsonrpcResponse
    }
}

class ICWalletClient {
    constructor(private readonly client: WalletClient) {}

    public connect(newMessageCallback: (message: ICPermissionRequest | ICCanisterCallRequest) => void) {
        this.client.connect(async (message: any) => {
            if (message.message.blockchainIdentifier !== 'ic') {
                return
            }

            const { type: _, ...params } = message.message.blockchainData

            if (message.message.type === BeaconMessageType.PermissionRequest) {
                newMessageCallback({
                    id: parseInt(message.id),
                    jsonrpc: '2.0',
                    method: 'permission',
                    params: {
                        ...params,
                        appMetadata: {
                            name: params.appMetadata.name,
                            url: params.appMetadata.url
                        }
                    }
                })
            } else if (message.message.type === BeaconMessageType.BlockchainRequest) {
                if (message.message.blockchainData.type === 'canister_call_request') {
                    newMessageCallback({
                        id: parseInt(message.id),
                        jsonrpc: '2.0',
                        method: 'canister_call',
                        params
                    })
                }
            }
        })
    }

    public async respondWithResult<T extends ICPermissionRequest | ICCanisterCallRequest>(request: T, result: T['method'] extends 'permission' ? ICPermissionResponse['result'] : ICCanisterCallResponse['result']): Promise<void> {
        if (request.method === 'permission') {
            const response: ICPermissionResponse = {
                id: request.id,
                jsonrpc: '2.0',
                result: result as ICPermissionResponse['result']
            }

            const beaconResponse = {
                id: response.id.toString(),
                message: {
                    blockchainIdentifier: 'ic',
                    type: BeaconMessageType.PermissionResponse,
                    blockchainData: {
                        type: 'permission_response',
                        ...response.result
                    }
                }
            }

            await this.client.respond(beaconResponse as any)
        } else if (request.method === 'canister_call') {
            const response: ICCanisterCallResponse = {
                id: request.id,
                jsonrpc: '2.0',
                result: result as ICCanisterCallResponse['result']
            }

            const beaconResponse = {
                id: response.id.toString(),
                message: {
                    blockchainIdentifier: 'ic',
                    type: BeaconMessageType.BlockchainResponse,
                    blockchainData: {
                        type: 'canister_call_response',
                        ...response.result
                    }
                }
            }

            await this.client.respond(beaconResponse as any)
        }

    }

    public async respondWithError(request: ICPermissionRequest | ICCanisterCallRequest, error: JsonRPCError['error']): Promise<void> {
        const response: JsonRPCError = {
            id: request.id,
            jsonrpc: '2.0',
            error 
        }

        let errorType: string = error.errorType
        switch (errorType) {
            case 'ABORTED':
                errorType = BeaconErrorType.ABORTED_ERROR
                break
            case 'VERSION_NOT_SUPPORTED':
                errorType = BeaconErrorType.UNKNOWN_ERROR
                break
            case 'NETWORK_NOT_SUPPORTED':
                errorType = BeaconErrorType.NETWORK_NOT_SUPPORTED
                break
            case 'NOT_GRANTED':
                errorType = BeaconErrorType.NOT_GRANTED_ERROR
                break
            case 'NETWORK':
                errorType = BeaconErrorType.UNKNOWN_ERROR
                break
            case 'UNKNOWN':
                errorType = BeaconErrorType.UNKNOWN_ERROR
                break
        }

        const beaconResponse = {
            id: response.id.toString(),
            type: BeaconMessageType.Error,
            errorType,
            description: error.description
        }

        await this.client.respond(beaconResponse as any)
    }
}

Object.defineProperty(DAppClient.prototype, "ic", {
    get: function() {
        return new ICDappClient(this)
    }
})

Object.defineProperty(WalletClient.prototype, "ic", {
    get: function() {
        return new ICWalletClient(this)
    }
})