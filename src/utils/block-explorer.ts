import { Network, NetworkType } from '..'

export abstract class BlockExplorer {
  constructor(
    public readonly mainnetUrl: string,
    public readonly carthagenetUrl: string,
    public readonly delphinetUrl: string,
    public readonly customUrl: string
  ) {}

  protected async getLinkForNetwork(network: Network): Promise<string> {
    return network.type === NetworkType.MAINNET
      ? this.mainnetUrl
      : network.type === NetworkType.CARTHAGENET
      ? this.carthagenetUrl
      : network.type === NetworkType.DELPHINET
      ? this.delphinetUrl
      : this.customUrl
  }

  /**
   * Return a blockexplorer link for an address
   *
   * @param address The address to be opened
   * @param network The network that was used
   */
  public abstract getAddressLink(address: string, network: Network): Promise<string>

  /**
   * Return a blockexplorer link for a transaction hash
   *
   * @param transactionId The hash of the transaction
   * @param network The network that was used
   */
  public abstract getTransactionLink(transactionId: string, network: Network): Promise<string>
}
