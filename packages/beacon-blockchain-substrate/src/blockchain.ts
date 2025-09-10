import {
  Blockchain,
  BlockchainMessage,
  ResponseInput,
  WalletLists
} from '@airgap/beacon-types'
import { fetchRemoteWalletLists } from '@airgap/beacon-core'
import { SubstratePermissionResponse } from './types/messages/permission-response'

export class SubstrateBlockchain implements Blockchain {
  public readonly identifier: string = 'substrate'

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
    return fetchRemoteWalletLists('substrate')
  }

  async getAccountInfosFromPermissionResponse(
    permissionResponse: SubstratePermissionResponse
  ): Promise<{ accountId: string; address: string; publicKey: string }[]> {
    return permissionResponse.blockchainData.accounts.map((account) => ({
      accountId: account.accountId,
      address: account.address,
      publicKey: account.publicKey
    }))
  }
}
