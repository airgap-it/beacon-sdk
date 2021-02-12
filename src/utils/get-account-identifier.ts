import { ready, crypto_generichash } from 'libsodium-wrappers'
import * as bs58check from 'bs58check'
import { Network } from '..'

/**
 * Generate a deterministic account identifier based on an address and a network
 *
 * @param address
 * @param network
 */
export const getAccountIdentifier = async (address: string, network: Network): Promise<string> => {
  const data: string[] = [address, network.type]
  if (network.name) {
    data.push(`name:${network.name}`)
  }
  if (network.rpcUrl) {
    data.push(`rpc:${network.rpcUrl}`)
  }

  await ready

  const buffer = Buffer.from(crypto_generichash(10, data.join('-')))

  return bs58check.encode(buffer)
}
