import {
  App,
  Blockchain,
  BlockchainMessage,
  DesktopApp,
  ExtensionApp,
  ResponseInput,
  WebApp
} from '@airgap/beacon-types'
import { DekuPermissionResponse } from './types/messages/permission-response'
import { desktopList, extensionList, iOSList, webList } from './ui/alert/wallet-lists'

export class DekuBlockchain implements Blockchain {
  public readonly identifier: string = 'deku'

  async validateRequest(input: BlockchainMessage): Promise<void> {
    // TODO: Validation
    if (input) {
      return
    }
  }
  async handleResponse(input: ResponseInput): Promise<void> {
    // TODO: Validation
    if (input) {
      return
    }
  }

  async getWalletLists(): Promise<{
    extensionList: ExtensionApp[]
    desktopList: DesktopApp[]
    webList: WebApp[]
    iOSList: App[]
  }> {
    return {
      extensionList: extensionList,
      desktopList: desktopList,
      webList: webList,
      iOSList: iOSList
    }
  }

  async getAccountInfosFromPermissionResponse(
    permissionResponse: DekuPermissionResponse
  ): Promise<{ accountId: string; address: string; publicKey: string }[]> {
    return permissionResponse.blockchainData.accounts.map((account) => ({
      accountId: account.accountId,
      address: account.address,
      publicKey: account.publicKey
    }))
  }
}
