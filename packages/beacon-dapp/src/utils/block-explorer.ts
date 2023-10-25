import { Network, NetworkType } from '@mavrykdynamics/beacon-types'

export abstract class BlockExplorer {
  constructor(public readonly rpcUrls: { [key in NetworkType]: string }) {}

  protected async getLinkForNetwork(network: Network): Promise<string> {
    return this.rpcUrls[network.type]
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
