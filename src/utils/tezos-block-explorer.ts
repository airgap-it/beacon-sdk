import { Network } from '..'
import { BlockExplorer } from './block-explorer'

export class TezblockBlockExplorer extends BlockExplorer {
  constructor(
    public readonly mainnetUrl: string = 'https://tezblock.io',
    public readonly carthagenetUrl: string = 'https://carthagenet.tezblock.io',
    public readonly delphinetUrl: string = 'https://delphinet.tezblock.io',
    public readonly customUrl: string = 'https://delphinet.tezblock.io'
  ) {
    super(mainnetUrl, carthagenetUrl, delphinetUrl, customUrl)
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
