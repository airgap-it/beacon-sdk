import { WalletClient } from '@airgap/beacon-sdk'

export function createWalletClient() {
  return new WalletClient({
    name: 'Example Wallet'
  })
}