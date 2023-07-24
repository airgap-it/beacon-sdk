import { App, Blockchain, BlockchainMessage, DesktopApp, ExtensionApp, ResponseInput, WebApp } from '@airgap/beacon-types'
import { ICBlockchainIdentifier } from './types/blockchain';
import { ICPermissionResponse } from './types/messages/permission-response';

export class ICPBlockchain implements Blockchain {
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
            extensionList: [],
            desktopList: [],
            webList: [],
            iOSList: []
        }
    }

    public async getAccountInfosFromPermissionResponse(
        _permissionResponse: ICPermissionResponse
    ): Promise<{ accountId: string; address: string; publicKey: string; }[]> {
        return [{
            accountId: '',
            address: '',
            publicKey: ''
        }]
    }
}