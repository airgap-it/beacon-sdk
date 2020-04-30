import { Network } from '..'

export const getAccountIdentifier = async (pubkey: string, network: Network): Promise<string> => {
  const data: string[] = [pubkey, network.type]
  if (network.name) {
    data.push(network.name)
  }
  if (network.rpcUrl) {
    data.push(network.rpcUrl)
  }

  return data.join('-')
}
