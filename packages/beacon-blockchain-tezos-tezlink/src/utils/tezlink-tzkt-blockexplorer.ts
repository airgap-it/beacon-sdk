import { Network, NetworkType } from '@airgap/beacon-types'
import { BlockExplorer } from './block-explorer'

export class TezlinkTzktBlockExplorer extends BlockExplorer {
  constructor(
    public readonly rpcUrls: { [key in NetworkType]: string } = {
      [NetworkType.MAINNET]: 'https://sandbox.tzkt.io',
      [NetworkType.GHOSTNET]: 'https://sandbox.tzkt.io',
      [NetworkType.WEEKLYNET]: 'https://sandbox.tzkt.io',
      [NetworkType.DAILYNET]: 'https://sandbox.tzkt.io',
      [NetworkType.DELPHINET]: 'https://sandbox.tzkt.io',
      [NetworkType.EDONET]: 'https://sandbox.tzkt.io',
      [NetworkType.FLORENCENET]: 'https://sandbox.tzkt.io',
      [NetworkType.GRANADANET]: 'https://sandbox.tzkt.io',
      [NetworkType.HANGZHOUNET]: 'https://sandbox.tzkt.io',
      [NetworkType.ITHACANET]: 'https://sandbox.tzkt.io',
      [NetworkType.JAKARTANET]: 'https://sandbox.tzkt.io',
      [NetworkType.KATHMANDUNET]: 'https://sandbox.tzkt.io',
      [NetworkType.LIMANET]: 'https://sandbox.tzkt.io',
      [NetworkType.MUMBAINET]: 'https://sandbox.tzkt.io',
      [NetworkType.NAIROBINET]: 'https://sandbox.tzkt.io',
      [NetworkType.OXFORDNET]: 'https://sandbox.tzkt.io',
      [NetworkType.PARISNET]: 'https://sandbox.tzkt.io',
      [NetworkType.CUSTOM]: 'https://sandbox.tzkt.io',
      [NetworkType.QUEBECNET]: 'https://sandbox.tzkt.io',
      [NetworkType.RIONET]: 'https://sandbox.tzkt.io',
      [NetworkType.SEOULNET]: 'https://sandbox.tzkt.io',
      [NetworkType.SHADOWNET]: 'https://sandbox.tzkt.io'
    }
  ) {
    super(rpcUrls)
  }

  private addTezlinkApiParam(url: string): string {
    const apiUrl = 'http://api.tzkt.tezlink.nomadic-labs.com:30010'
    const encodedApiUrl = encodeURIComponent(apiUrl)
    return `${url}/?tzkt_api_url=${encodedApiUrl}`
  }

  public async getAddressLink(address: string, network: Network): Promise<string> {
    const blockExplorer = await this.getLinkForNetwork(network)
    return this.addTezlinkApiParam(`${blockExplorer}/${address}`)
  }

  public async getTransactionLink(transactionId: string, network: Network): Promise<string> {
    const blockExplorer = await this.getLinkForNetwork(network)
    return this.addTezlinkApiParam(`${blockExplorer}/${transactionId}`)
  }
}