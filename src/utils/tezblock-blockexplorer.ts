import { Network, NetworkType } from '..'
import { BlockExplorer } from './block-explorer'

export class TezblockBlockExplorer extends BlockExplorer {
  constructor(
    public readonly rpcUrls: { [key in NetworkType]: string } = {
      [NetworkType.MAINNET]: 'https://tezblock.io',
      [NetworkType.DELPHINET]: 'https://delphinet.tezblock.io',
      [NetworkType.EDONET]: 'https://edonet.tezblock.io',
      [NetworkType.FLORENCENET]: 'https://florencenet.tezblock.io',
      [NetworkType.GRANADANET]: 'https://granadanet.tezblock.io',
      [NetworkType.HANGZHOUNET]: 'https://hangzhounet.tezblock.io',
      [NetworkType.ITHACANET]: 'https://ithacanet.tezblock.io',
      [NetworkType.CUSTOM]: 'https://ithacanet.tezblock.io'
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
