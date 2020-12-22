import {
  BlockExplorer,
  DAppClient,
  ErrorResponse,
  PermissionResponseOutput,
  NetworkType,
  Network
} from '..' // Replace '..' with '@airgap/beacon-sdk'

class TzStatsBlockExplorer extends BlockExplorer {
  constructor(
    public readonly rpcUrls: { [key in NetworkType]: string } = {
      [NetworkType.MAINNET]: 'https://tzstats.com/',
      [NetworkType.DELPHINET]: 'https://delphi.tzstats.com/',
      [NetworkType.EDONET]: 'https://edo.tzstats.com/',
      [NetworkType.CUSTOM]: 'https://edo.tzstats.com/'
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

const client = new DAppClient({ name: 'My Sample DApp', blockExplorer: new TzStatsBlockExplorer() })

client
  .requestPermissions()
  .then((response: PermissionResponseOutput) => {
    console.log('permissions', response)
  })
  .catch((permissionError: ErrorResponse) => console.error(permissionError))
