import { getAccountIdentifier } from '@airgap/beacon-core'
import { App, Blockchain, BlockchainMessage, DesktopApp, ExtensionApp, ResponseInput, WebApp } from '@airgap/beacon-types'

import { ICBlockchainIdentifier } from './types/blockchain'
import { ICPermissionResponse } from './types/messages/permission-response'
import { extensionList, desktopList, webList, iOSList } from './ui/alert/wallet-lists'
import { ICNetwork } from './types/network'

export class ICBlockchain implements Blockchain {
    public readonly identifier: ICBlockchainIdentifier = 'ic'

    public async validateRequest(input: BlockchainMessage<string>): Promise<void> {
        if (input) {
            return
        }
    }

    public async handleResponse(input: ResponseInput): Promise<void> {
        if (input) {
            return
        }
    }

    public async getWalletLists(): Promise<{ 
        extensionList: ExtensionApp[]
        desktopList: DesktopApp[]
        webList: WebApp[]
        iOSList: App[]
    }> {
        return {
            extensionList,
            desktopList,
            webList,
            iOSList
        }
    }

    public async getAccountInfosFromPermissionResponse(
        permissionResponse: ICPermissionResponse
    ): Promise<{ accountId: string; address: string; publicKey: string; }[]> {
        return Promise.all(permissionResponse.blockchainData.networks.map(async (network: ICNetwork) => {
            const accountId = await getAccountIdentifier(
                permissionResponse.blockchainData.account.subaccount 
                    ? `${permissionResponse.blockchainData.account.owner}:${permissionResponse.blockchainData.account.subaccount}`
                    : permissionResponse.blockchainData.account.owner,
                network as any
            )
            return {
                accountId,
                address: '',
                publicKey: ''
            }
        }))
    }
}