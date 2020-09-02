import { Network, NetworkType } from '..'

/**
 * Return a blockexplorer link for an address
 *
 * @param network The network that was used
 * @param address The address to be opened
 */
export const getAccountBlockExplorerLinkForNetwork = async (
  network: Network,
  address: string
): Promise<string> => {
  const urls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezblock.io/account/',
    [NetworkType.CARTHAGENET]: 'https://carthagenet.tezblock.io/account/',
    [NetworkType.CUSTOM]: 'https://carthagenet.tezblock.io/account/'
  }
  const url: string = urls[network ? network.type : NetworkType.MAINNET]

  return `${url}${address}`
}

/**
 * Return a blockexplorer link for a transaction hash
 *
 * @param network The network that was used
 * @param transactionHash The hash of the transaction
 */
export const getTransactionBlockExplorerLinkForNetwork = async (
  network: Network,
  transactionHash: string
): Promise<string> => {
  const urls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezblock.io/transaction/',
    [NetworkType.CARTHAGENET]: 'https://carthagenet.tezblock.io/transaction/',
    [NetworkType.CUSTOM]: 'https://carthagenet.tezblock.io/transaction/'
  }
  const url: string = urls[network ? network.type : NetworkType.MAINNET]

  return `${url}${transactionHash}`
}
