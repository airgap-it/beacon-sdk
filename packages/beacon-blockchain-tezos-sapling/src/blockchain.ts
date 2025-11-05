import {
  Blockchain,
  BlockchainMessage,
  ResponseInput,
  ExtensionApp,
  DesktopApp,
  WebApp,
  App,
  Network,
  PermissionScope
} from '@airgap/beacon-types'
import { TezosSaplingPermissionResponse } from './types/messages/permission-response'
import bundledTezosSaplingRegistry from '../../beacon-ui/src/data/tezos-sapling.json'
import { loadWalletLists } from '@airgap/beacon-utils'

const { desktopList, extensionList, iOSList, webList } = loadWalletLists(bundledTezosSaplingRegistry)

export class TezosSaplingBlockchain implements Blockchain {
  public readonly identifier: string = 'tezos-sapling'

  async validateRequest(_input: BlockchainMessage): Promise<void> {
    // No special validation required
  }

  async handleResponse(_input: ResponseInput): Promise<void> {
    // No special response handling required.
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
    permissionResponse: TezosSaplingPermissionResponse
  ): Promise<{
    accountId: string;
    address: string;
    publicKey: string;
    network?: Network;
    scopes: PermissionScope[];
  }[]> {
    return permissionResponse.blockchainData.accounts.map((account) => ({
      accountId: account.accountId,
      address: account.address,
      publicKey: account.viewingKey ?? '', // Public key or viewing key is not shared in permission request for privacy reasons
      network: account.network,
      scopes: []
    }))
  }
}
