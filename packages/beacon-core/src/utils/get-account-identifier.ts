import * as bs58check from 'bs58check'
import { Network } from '@mavrykdynamics/beacon-types'
import { hash } from '@stablelib/blake2b'
import { encode } from '@stablelib/utf8'

/**
 * @internalapi
 *
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

  const buffer = Buffer.from(hash(encode(data.join('-')), 10))

  return bs58check.encode(buffer)
}
