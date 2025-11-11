import {
  Blockchain,
  BlockchainMessage,
  PermissionResponseV3,
  ResponseInput,
  App,
  DesktopApp,
  ExtensionApp,
  WebApp,
  Network,
  PermissionScope
} from '@airgap/beacon-types'
import bundledTezosRegistry from '@airgap/beacon-ui/data/tezos.json'
import { loadWalletLists } from '@airgap/beacon-utils'

const { desktopList, extensionList, iOSList, webList } = loadWalletLists(bundledTezosRegistry)

export class TezosBlockchain implements Blockchain {
  public readonly identifier: string = 'xtz'
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
    _permissionResponse: PermissionResponseV3<'tezos'>
  ): Promise<{
    accountId: string;
    address: string;
    publicKey: string;
    network?: Network;
    scopes: PermissionScope[];
  }[]> {
    return [{
      accountId: '',
      address: '',
      publicKey: '',
      network: undefined,
      scopes: []
    }]
  }
}
