import * as sodium from 'libsodium-wrappers'
import * as bs58check from 'bs58check'
import { Network } from '..'

export const getAccountIdentifier = async (address: string, network: Network): Promise<string> => {
  const data: string[] = [address, network.type]
  if (network.name) {
    data.push(`name:${network.name}`)
  }
  if (network.rpcUrl) {
    data.push(`rpc:${network.rpcUrl}`)
  }

  await sodium.ready

  const buffer = Buffer.from(sodium.crypto_generichash(10, data.join('-')))

  return bs58check.encode(buffer)
}
