import { Network, NetworkType } from '..'
import { BlockExplorer } from './block-explorer'

export class TezblockBlockExplorer extends BlockExplorer {
  constructor(
    public readonly rpcUrls: { [key in NetworkType]: string } = {
      [NetworkType.MAINNET]: 'https://tezblock.io',
      [NetworkType.CARTHAGENET]: 'https://carthagenet.tezblock.io',
      [NetworkType.DELPHINET]: 'https://delphinet.tezblock.io',
      [NetworkType.CUSTOM]: 'https://delphinet.tezblock.io'
    }
  ) {
    super(rpcUrls)
  }

  public async getAddressLink(address: string, network: Network): Promise<string> {
    const blockExplorer = await this.getLinkForNetwork(network)

    return `${blockExplorer}/account/${address}`
  }
  public async getTransactionLink(transactionId: string, network: Network): Promise<string> {
    const blockExplorer = await this.getLinkForNetwork(network)

    return `${blockExplorer}/transaction/${transactionId}`
  }
}
