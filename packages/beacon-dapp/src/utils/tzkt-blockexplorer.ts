import { Network, NetworkType } from '@airgap/beacon-types'
import { BlockExplorer } from './block-explorer'

export class TzktBlockExplorer extends BlockExplorer {
  constructor(
    public readonly rpcUrls: { [key in NetworkType]: string } = {
      [NetworkType.MAINNET]: 'https://tzkt.io',
      [NetworkType.GHOSTNET]: 'https://ghostnet.tzkt.io',
      [NetworkType.MONDAYNET]: 'https://mondaynet.tzkt.io',
      [NetworkType.DAILYNET]: 'https://dailynet.tzkt.io',
      [NetworkType.DELPHINET]: 'https://delphinet.tzkt.io',
      [NetworkType.EDONET]: 'https://edonet.tzkt.io',
      [NetworkType.FLORENCENET]: 'https://florencenet.tzkt.io',
      [NetworkType.GRANADANET]: 'https://granadanet.tzkt.io',
      [NetworkType.HANGZHOUNET]: 'https://hangzhounet.tzkt.io',
      [NetworkType.ITHACANET]: 'https://ithacanet.tzkt.io',
      [NetworkType.JAKARTANET]: 'https://jakartanet.tzkt.io',
      [NetworkType.KATHMANDUNET]: 'https://kathmandunet.tzkt.io',
      [NetworkType.LIMANET]: 'https://limanet.tzkt.io',
      [NetworkType.MUMBAINET]: 'https://mumbainet.tzkt.io',
      [NetworkType.CUSTOM]: 'https://mumbainet.tzkt.io'
    }
  ) {
    super(rpcUrls)
  }

  public async getAddressLink(address: string, network: Network): Promise<string> {
    const blockExplorer = await this.getLinkForNetwork(network)

    return `${blockExplorer}/${address}`
  }
  public async getTransactionLink(transactionId: string, network: Network): Promise<string> {
    const blockExplorer = await this.getLinkForNetwork(network)

    return `${blockExplorer}/${transactionId}`
  }
}
