import { Blockchain, BlockchainMessage, ResponseInput } from '@airgap/beacon-types'
import { SubstratePermissionResponse } from './messages/operation-request'

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

  async getAddressFromPermissionResponse(
    permissionResponse: SubstratePermissionResponse
  ): Promise<string> {
    // TODO: Handle multiple accounts
    return `${permissionResponse.payload.accounts[0].publicKey}`
  }
}
