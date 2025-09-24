import {
  Blockchain,
  BlockchainMessage,
  PermissionResponseV3,
  ResponseInput,
  WalletLists
} from '@airgap/beacon-types'
import { fetchRemoteWalletLists } from '@airgap/beacon-core'

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

  async getWalletLists(): Promise<WalletLists> {
    return fetchRemoteWalletLists('tezos')
  }

  async getAccountInfosFromPermissionResponse(
    _permissionResponse: PermissionResponseV3<'tezos'>
  ): Promise<{ accountId: string; address: string; publicKey: string }[]> {
    return [{ accountId: '', address: '', publicKey: '' }]
  }
}
