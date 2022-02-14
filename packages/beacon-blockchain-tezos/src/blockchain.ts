import {
  Blockchain,
  BlockchainMessage,
  PermissionResponseV3,
  ResponseInput
} from '@airgap/beacon-types'

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

  async getAddressFromPermissionResponse(
    _permissionResponse: PermissionResponseV3<'tezos'>
  ): Promise<string[]> {
    return [''] // getAddressFromPublicKey(permissionResponse.publicKey)
  }
}
