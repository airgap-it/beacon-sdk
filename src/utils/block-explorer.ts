import { Network, NetworkType } from '..'

export const getAccountBlockExplorerLinkForNetwork = async (
  network: Network,
  address: string
): Promise<string> => {
  const urls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezblock.io/account/',
    [NetworkType.CARTHAGENET]: 'https://carthagenet.tezblock.io/account/',
    [NetworkType.DELPHINET]: 'https://delphinet.tezblock.io/account/',
    [NetworkType.CUSTOM]: 'https://delphinet.tezblock.io/account/'
  }
  const url: string = urls[network ? network.type : NetworkType.MAINNET]

  return `${url}${address}`
}

export const getTransactionBlockExplorerLinkForNetwork = async (
  network: Network,
  transactionHash: string
): Promise<string> => {
  const urls: { [key in NetworkType]: string } = {
    [NetworkType.MAINNET]: 'https://tezblock.io/transaction/',
    [NetworkType.CARTHAGENET]: 'https://carthagenet.tezblock.io/transaction/',
    [NetworkType.DELPHINET]: 'https://delphinet.tezblock.io/transaction/',
    [NetworkType.CUSTOM]: 'https://delphinet.tezblock.io/transaction/'
  }
  const url: string = urls[network ? network.type : NetworkType.MAINNET]

  return `${url}${transactionHash}`
}
