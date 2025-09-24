import {
  Blockchain,
  BlockchainMessage,
  ResponseInput,
  WalletLists
} from '@airgap/beacon-types'
import { fetchRemoteWalletLists } from '@airgap/beacon-core'
import { TezosSaplingPermissionResponse } from './types/messages/permission-response'

export class TezosSaplingBlockchain implements Blockchain {
  public readonly identifier: string = 'tezos-sapling'

  async validateRequest(_input: BlockchainMessage): Promise<void> {
    // No special validation required
  }

  async handleResponse(_input: ResponseInput): Promise<void> {
    // No special response handling required.
  }

  async getWalletLists(): Promise<WalletLists> {
    return fetchRemoteWalletLists('tezos-sapling')
  }

  async getAccountInfosFromPermissionResponse(
    permissionResponse: TezosSaplingPermissionResponse
  ): Promise<{ accountId: string; address: string; publicKey: string }[]> {
    return permissionResponse.blockchainData.accounts.map((account) => ({
      accountId: account.accountId,
      address: account.address,
      publicKey: account.viewingKey ?? '' // Public key or viewing key is not shared in permission request for privacy reasons
    }))
  }
}
